"use client";

import { useMemo } from "react";

import { createSupabaseBrowserClient } from "./client";

export function useSupabaseBrowserClient() {
  return useMemo(() => createSupabaseBrowserClient(), []);
}
