"use client";

import { createContext, useContext } from "react";
import type { User } from "@/data/types";
import { unknownUser } from "@/state/view";

/** Everyone in the trip, by person id: what the room's cards draw faces from. */
const RoomUsers = createContext<Record<string, User>>({});

export const RoomUsersProvider = RoomUsers.Provider;

/** Looks people up by id; someone who has left the trip gets a name-less stand-in. */
export function useRoomUsers(): (personId: string) => User {
  const users = useContext(RoomUsers);
  return (personId) => users[personId] ?? unknownUser(personId);
}
