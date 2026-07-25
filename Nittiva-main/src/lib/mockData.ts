// Mock data service to replace API calls
// This provides local data management without external API dependencies

export interface MockClient {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  created_at: string;
}

export interface MockNote {
  id: number;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface MockTodo {
  id: number;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  due_date: string;
  created_at: string;
  updated_at: string;
}

export interface MockMeeting {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  participants: string[];
  created_at: string;
  updated_at: string;
}

export interface MockLeaveRequest {
  id: number;
  type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface MockNotification {
  id: number;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  is_read: boolean;
  created_at: string;
}

class MockDataService {
  private getStorageKey(type: string): string {
    return `nittiva_${type}`;
  }

  private generateId(): number {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  private loadData<T>(type: string, defaultData: T[] = []): T[] {
    const stored = localStorage.getItem(this.getStorageKey(type));
    return stored ? JSON.parse(stored) : defaultData;
  }

  private saveData<T>(type: string, data: T[]): void {
    localStorage.setItem(this.getStorageKey(type), JSON.stringify(data));
  }

  // Clients
  getClients(): MockClient[] {
    return this.loadData<MockClient>("clients", [
      {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        phone: "+1-555-0123",
        company: "Tech Corp",
        status: "active",
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "+1-555-0124",
        company: "Design Studio",
        status: "active",
        created_at: new Date().toISOString(),
      },
    ]);
  }

  createClient(client: Omit<MockClient, "id" | "created_at">): MockClient {
    const clients = this.getClients();
    const newClient: MockClient = {
      ...client,
      id: this.generateId(),
      created_at: new Date().toISOString(),
    };
    clients.push(newClient);
    this.saveData("clients", clients);
    return newClient;
  }

  updateClient(id: number, updates: Partial<MockClient>): MockClient | null {
    const clients = this.getClients();
    const index = clients.findIndex((c) => c.id === id);
    if (index === -1) return null;

    clients[index] = { ...clients[index], ...updates };
    this.saveData("clients", clients);
    return clients[index];
  }

  deleteClient(id: number): boolean {
    const clients = this.getClients();
    const filteredClients = clients.filter((c) => c.id !== id);
    this.saveData("clients", filteredClients);
    return filteredClients.length !== clients.length;
  }

  // Notes
  getNotes(): MockNote[] {
    return this.loadData<MockNote>("notes", [
      {
        id: 1,
        title: "Project Meeting Notes",
        content: "Discussed project timeline and deliverables.",
        is_pinned: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 2,
        title: "Client Requirements",
        content: "Updated requirements from client feedback session.",
        is_pinned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  }

  createNote(
    note: Omit<MockNote, "id" | "created_at" | "updated_at">,
  ): MockNote {
    const notes = this.getNotes();
    const newNote: MockNote = {
      ...note,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    notes.push(newNote);
    this.saveData("notes", notes);
    return newNote;
  }

  updateNote(id: number, updates: Partial<MockNote>): MockNote | null {
    const notes = this.getNotes();
    const index = notes.findIndex((n) => n.id === id);
    if (index === -1) return null;

    notes[index] = {
      ...notes[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.saveData("notes", notes);
    return notes[index];
  }

  deleteNote(id: number): boolean {
    const notes = this.getNotes();
    const filteredNotes = notes.filter((n) => n.id !== id);
    this.saveData("notes", filteredNotes);
    return filteredNotes.length !== notes.length;
  }

  // Todos
  getTodos(): MockTodo[] {
    return this.loadData<MockTodo>("todos", [
      {
        id: 1,
        title: "Review client proposal",
        description: "Review and provide feedback on the new project proposal",
        status: "pending",
        priority: "high",
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 2,
        title: "Update project documentation",
        description: "Update technical documentation for the current sprint",
        status: "in_progress",
        priority: "medium",
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  }

  createTodo(
    todo: Omit<MockTodo, "id" | "created_at" | "updated_at">,
  ): MockTodo {
    const todos = this.getTodos();
    const newTodo: MockTodo = {
      ...todo,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    todos.push(newTodo);
    this.saveData("todos", todos);
    return newTodo;
  }

  updateTodo(id: number, updates: Partial<MockTodo>): MockTodo | null {
    const todos = this.getTodos();
    const index = todos.findIndex((t) => t.id === id);
    if (index === -1) return null;

    todos[index] = {
      ...todos[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.saveData("todos", todos);
    return todos[index];
  }

  deleteTodo(id: number): boolean {
    const todos = this.getTodos();
    const filteredTodos = todos.filter((t) => t.id !== id);
    this.saveData("todos", filteredTodos);
    return filteredTodos.length !== todos.length;
  }

  // Meetings
  getMeetings(): MockMeeting[] {
    return this.loadData<MockMeeting>("meetings", [
      {
        id: 1,
        title: "Weekly Team Standup",
        description: "Weekly team synchronization meeting",
        start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(
          Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000,
        ).toISOString(),
        participants: ["john@example.com", "jane@example.com"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  }

  createMeeting(
    meeting: Omit<MockMeeting, "id" | "created_at" | "updated_at">,
  ): MockMeeting {
    const meetings = this.getMeetings();
    const newMeeting: MockMeeting = {
      ...meeting,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    meetings.push(newMeeting);
    this.saveData("meetings", meetings);
    return newMeeting;
  }

  updateMeeting(id: number, updates: Partial<MockMeeting>): MockMeeting | null {
    const meetings = this.getMeetings();
    const index = meetings.findIndex((m) => m.id === id);
    if (index === -1) return null;

    meetings[index] = {
      ...meetings[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.saveData("meetings", meetings);
    return meetings[index];
  }

  deleteMeeting(id: number): boolean {
    const meetings = this.getMeetings();
    const filteredMeetings = meetings.filter((m) => m.id !== id);
    this.saveData("meetings", filteredMeetings);
    return filteredMeetings.length !== meetings.length;
  }

  // Leave Requests
  getLeaveRequests(): MockLeaveRequest[] {
    return this.loadData<MockLeaveRequest>("leaveRequests", [
      {
        id: 1,
        type: "Annual Leave",
        start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        end_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        reason: "Vacation with family",
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  }

  createLeaveRequest(
    request: Omit<MockLeaveRequest, "id" | "created_at" | "updated_at">,
  ): MockLeaveRequest {
    const requests = this.getLeaveRequests();
    const newRequest: MockLeaveRequest = {
      ...request,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    requests.push(newRequest);
    this.saveData("leaveRequests", requests);
    return newRequest;
  }

  updateLeaveRequest(
    id: number,
    updates: Partial<MockLeaveRequest>,
  ): MockLeaveRequest | null {
    const requests = this.getLeaveRequests();
    const index = requests.findIndex((r) => r.id === id);
    if (index === -1) return null;

    requests[index] = {
      ...requests[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.saveData("leaveRequests", requests);
    return requests[index];
  }

  deleteLeaveRequest(id: number): boolean {
    const requests = this.getLeaveRequests();
    const filteredRequests = requests.filter((r) => r.id !== id);
    this.saveData("leaveRequests", filteredRequests);
    return filteredRequests.length !== requests.length;
  }

  // Notifications
  getNotifications(): MockNotification[] {
    return this.loadData<MockNotification>("notifications", [
      {
        id: 1,
        title: "Welcome to NITTIVA",
        message: "Welcome to your new enterprise management platform!",
        type: "info",
        is_read: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        title: "Task Assigned",
        message: "You have been assigned a new task: Review client proposal",
        type: "success",
        is_read: false,
        created_at: new Date().toISOString(),
      },
    ]);
  }

  markNotificationAsRead(id: number): boolean {
    const notifications = this.getNotifications();
    const notification = notifications.find((n) => n.id === id);
    if (!notification) return false;

    notification.is_read = true;
    this.saveData("notifications", notifications);
    return true;
  }

  deleteNotification(id: number): boolean {
    const notifications = this.getNotifications();
    const filteredNotifications = notifications.filter((n) => n.id !== id);
    this.saveData("notifications", filteredNotifications);
    return filteredNotifications.length !== notifications.length;
  }
}

export const mockDataService = new MockDataService();
