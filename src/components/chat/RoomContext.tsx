"use client";

import { createContext, useContext } from "react";
import type { User } from "@/data/types";
import { mentionHandles } from "@/lib/mentions";
import { unknownUser } from "@/state/view";

/** Everyone in the trip, by person id: what the room's cards draw faces from. */
const RoomUsers = createContext<Record<string, User>>({});

export const RoomUsersProvider = RoomUsers.Provider;

/** Looks people up by id; someone who has left the trip gets a name-less stand-in. */
export function useRoomUsers(): (personId: string) => User {
  const users = useContext(RoomUsers);
  return (personId) => users[personId] ?? unknownUser(personId);
}

// One list per people record: every bubble of a render asks with the same one.
const handlesByUsers = new WeakMap<Record<string, User>, string[]>();

/** What each person in the trip is written as after "@" (none outside a room: only "@Go" is a mention there). */
export function useMentionHandles(): string[] {
  const users = useContext(RoomUsers);
  let handles = handlesByUsers.get(users);
  if (!handles) {
    handles = mentionHandles(Object.values(users)).map((h) => h.handle);
    handlesByUsers.set(users, handles);
  }
  return handles;
}
