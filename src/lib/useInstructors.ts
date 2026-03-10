'use client';

import { useState, useEffect } from 'react';
import { Instructor } from './types';

let cachedInstructors: Instructor[] | null = null;
let fetchPromise: Promise<Instructor[]> | null = null;

async function fetchInstructors(): Promise<Instructor[]> {
  const res = await fetch('/api/instructors');
  if (!res.ok) return [];
  return res.json();
}

export function useInstructors(): Instructor[] {
  const [instructors, setInstructors] = useState<Instructor[]>(cachedInstructors || []);

  useEffect(() => {
    if (cachedInstructors) {
      setInstructors(cachedInstructors);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = fetchInstructors();
    }

    fetchPromise.then((data) => {
      cachedInstructors = data;
      setInstructors(data);
    });
  }, []);

  return instructors;
}

export function invalidateInstructorsCache() {
  cachedInstructors = null;
  fetchPromise = null;
}
