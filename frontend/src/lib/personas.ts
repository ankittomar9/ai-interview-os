/**
 * Centralized AI Persona Identities for AI Interview OS.
 * Locked names and roles per system specification.
 */

export interface PersonaIdentity {
  name: string;
  title: string;
  role: string;
  welcomeMessage: string;
}

export const PERSONAS = {
  INTERVIEW: {
    name: 'Dr. Anya Chen',
    title: 'AI Principal Bar Raiser',
    role: 'Principal Engineer & Bar Raiser',
    welcomeMessage: `Welcome to your Technical Assessment! 👋\n\nI am Dr. Anya Chen, AI Principal Bar Raiser. Let's begin with a brief introduction. Please tell me about your engineering background and recent systems you've built.`
  },
  PLAYGROUND: {
    name: 'Coach Sam',
    title: 'AI Socratic Coach',
    role: 'Senior Tech Lead & Socratic Coach',
    welcomeMessage: `Welcome to the Playground Practice Arena! 🧪\n\nI am Coach Sam, your AI Code & Architecture Coach. Feel free to explore solutions, request hints, or ask me for code explanations at any time.`
  }
} as const;

export function getPersona(isPlayground: boolean): PersonaIdentity {
  return isPlayground ? PERSONAS.PLAYGROUND : PERSONAS.INTERVIEW;
}
