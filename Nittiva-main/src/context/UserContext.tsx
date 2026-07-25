import * as React from "react";
import { createContext, useContext, useState, ReactNode } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: "admin" | "manager" | "developer" | "designer";
  status: "online" | "offline" | "away";
  color: string;
  joinDate: Date;
  tasksAssigned: number;
  tasksCompleted: number;
  hoursWorked: number;
  department: string;
}

export interface UserContextType {
  users: User[];
  currentUser: User | null;
  addUser: (userData: Omit<User, "id" | "joinDate">) => void;
  updateUser: (id: string, userData: Partial<User>) => void;
  deleteUser: (id: string) => void;
  getUserById: (id: string) => User | undefined;
  setCurrentUser: (user: User) => void;
}

const UserContext = React.createContext<UserContextType | undefined>(undefined);

const defaultUsers: User[] = [
  {
    id: "1",
    name: "olsocials",
    email: "olsocials@example.com",
    avatar: "OS",
    role: "admin",
    status: "online",
    color: "#befca9",
    joinDate: new Date("2023-01-15"),
    tasksAssigned: 8,
    tasksCompleted: 6,
    hoursWorked: 120,
    department: "Management",
  },
  {
    id: "2",
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: "JD",
    role: "developer",
    status: "away",
    color: "#8b5cf6",
    joinDate: new Date("2023-03-20"),
    tasksAssigned: 5,
    tasksCompleted: 4,
    hoursWorked: 95,
    department: "Development",
  },
  {
    id: "3",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    avatar: "JS",
    role: "designer",
    status: "offline",
    color: "#f59e0b",
    joinDate: new Date("2023-02-10"),
    tasksAssigned: 3,
    tasksCompleted: 2,
    hoursWorked: 75,
    department: "Design",
  },
  {
    id: "4",
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    avatar: "AJ",
    role: "manager",
    status: "online",
    color: "#ef4444",
    joinDate: new Date("2023-01-05"),
    tasksAssigned: 4,
    tasksCompleted: 3,
    hoursWorked: 88,
    department: "Management",
  },
];

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [users, setUsers] = React.useState<User[]>(defaultUsers);
  const [currentUser, setCurrentUser] = React.useState<User | null>(
    defaultUsers[0],
  );

  const addUser = (userData: Omit<User, "id" | "joinDate">) => {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      joinDate: new Date(),
    };
    setUsers([...users, newUser]);
  };

  const updateUser = (id: string, userData: Partial<User>) => {
    setUsers(
      users.map((user) => (user.id === id ? { ...user, ...userData } : user)),
    );
  };

  const deleteUser = (id: string) => {
    setUsers(users.filter((user) => user.id !== id));
    if (currentUser?.id === id) {
      setCurrentUser(users.length > 1 ? users[0] : null);
    }
  };

  const getUserById = (id: string) => {
    return users.find((user) => user.id === id);
  };

  return (
    <UserContext.Provider
      value={{
        users,
        currentUser,
        addUser,
        updateUser,
        deleteUser,
        getUserById,
        setCurrentUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export function useUser() {
  const context = React.useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
