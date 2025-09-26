// app/types/index.ts
export interface User {
  id: string;
  email: string;
  spe_number: string;
  level: number;
  has_voted: boolean;
}

export interface Candidate {
  id: string;
  full_name: string;
  position: string;
  bio: string;
  image_url: string;
  vote_count: number;
}

export interface LoginRequest {
  email: string;
  spe_number: string;
  recaptchaToken: string;
}