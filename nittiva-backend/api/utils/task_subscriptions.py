"""
Task subscription helpers.

Used by Note and Comment views to auto-subscribe users to a task when they
interact with it (create a note, post a comment, or are @-mentioned).
"""
import logging
from typing import Iterable, Optional
from uuid import UUID

logger = logging.getLogger(__name__)


def subscribe_users_to_task(
    *,
    task_id: UUID,
    user_ids: Iterable[UUID],
    added_by_id: Optional[UUID] = None,
    tenant_id: Optional[UUID] = None,
) -> int:
    """Idempotently subscribe a set of users to a task.

    Skips users who are already subscribers. Returns the number of new
    subscriptions created.
    """
    from api.models import TaskSubscriber

    user_ids = [u for u in set(user_ids) if u is not None]
    if not user_ids:
        return 0

    # Existing subscribers
    existing = set(
        TaskSubscriber.objects.filter(task_id=task_id, user_id__in=user_ids).values_list(
            "user_id", flat=True
        )
    )
    new_user_ids = [u for u in user_ids if u not in existing]
    if not new_user_ids:
        return 0

    TaskSubscriber.objects.bulk_create(
        [
            TaskSubscriber(
                task_id=task_id,
                user_id=u,
                created_by_id=added_by_id,
                tenant_id=tenant_id,
            )
            for u in new_user_ids
        ],
        ignore_conflicts=True,
    )
    return len(new_user_ids)


def maybe_subscribe_on_note_or_comment(
    *,
    content_type: str,
    object_id,
    author_id,
    mentioned_user_ids: Optional[Iterable] = None,
):
    """If the note/comment is attached to a task, auto-subscribe the relevant users.

    Triggered on every Note / Comment creation. For 'task' content_type, subscribes:
      - The author (so they get notifications about changes to the task)
      - Each @-mentioned user (so they get notified about this comment)
    """
    if content_type != "task" or not object_id:
        return

    user_ids = set(mentioned_user_ids or [])
    user_ids.add(author_id)
    user_ids.discard(None)

    # task_id is what TaskSubscriber expects. Task uses BigAutoField (integer)
    # while Note.object_id / Comment.object_id are now CharField, so we
    # coerce the string to int when content_type is "task". If the cast
    # fails (e.g., the value isn't a valid integer for a task), the
    # subscription is silently skipped — better than failing the create.
    task_id = object_id
    try:
        task_id = int(object_id)
    except (TypeError, ValueError):
        # Not an int-shaped task id; let subscribe_users_to_task handle it
        # and fail-soft via the try/except below.
        pass
    try:
        new_subs = subscribe_users_to_task(
            task_id=task_id,
            user_ids=user_ids,
            added_by_id=author_id,
        )
        return new_subs  # return count for callers / debugging
    except Exception as e:  # noqa: BLE001
        import traceback
        # Re-raise with a clearer message so we can see the error in the
        # comment response (debug only — should not be left in production).
        raise Exception(
            f"maybe_subscribe failed: {type(e).__name__}: {e}\n"
            f"object_id={object_id!r}, task_id={task_id!r}, user_ids={list(user_ids)!r}\n"
            f"{traceback.format_exc()}"
        ) from e


def notify_mentioned_users(
    *,
    mentioned_user_ids: Iterable,
    actor_id,
    title: str,
    message: str = "",
    link: str = "",
    tenant_id=None,
):
    """Create an in-app notification for each mentioned user (skips the actor)."""
    from api.models import Notification

    for uid in set(mentioned_user_ids or []):
        if uid == actor_id:
            continue  # Don't notify the actor about their own mention
        try:
            Notification.objects.create(
                recipient_id=uid,
                type="info",
                title=title,
                message=message,
                link=link,
                tenant_id=tenant_id,
            )
        except Exception as e:  # noqa: BLE001
            logger.warning("Failed to notify user %s: %s", uid, e)
