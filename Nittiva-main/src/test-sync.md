# Board-Table Data Synchronization Test

## How to Test the Synchronization:

1. **Navigate to a project**:

   - Go to `/dashboard/projects/1` (Task List view)
   - You should see tasks with status dropdowns in the Status column

2. **Change status in Task List**:

   - Click on any task's status dropdown
   - Change from "To Do" to "In Progress"
   - Note the task name

3. **Navigate to Board View**:

   - Click on "Board" in the sidebar for the same project
   - Go to `/dashboard/projects/1/board`
   - The task should now appear in the "In Progress" column

4. **Change status in Board View**:

   - Drag a task from "To Do" to "Completed" column
   - Note the task name and the visual feedback (brief highlight)

5. **Go back to Task List**:
   - Navigate back to `/dashboard/projects/1`
   - The task should now show "Completed" in its status dropdown

## Expected Behavior:

- ✅ Changes in Task List status dropdown should reflect in Board View
- ✅ Drag and drop in Board View should reflect in Task List status
- ✅ Header badges should update to show correct counts
- ✅ Both views share the same TaskContext state
- ✅ Console should log drag operations for debugging

## Technical Implementation:

- Both components use `useTask()` hook from TaskContext
- TaskList uses `updateTask()` method for status changes
- TaskBoard uses `moveTask()` method for drag operations
- Both methods update the same shared state
