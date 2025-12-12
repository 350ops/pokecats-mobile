export type RescueFlag = 'injured' | 'very-thin' | 'friendly' | 'kitten' | 'colony' | string;

export type Cat = {
  id: number;
  name: string;
  image?: string | null;
  breed?: string | null;
  status?: string | null;
  description?: string | null;
  distance?: string | null;
  lastFed?: string | Date | null;
  lastSighted?: string | Date | null;
  tnrStatus?: boolean | null;
  timesFed?: number | null;
  rescueFlags?: RescueFlag[] | null;
  colorProfile?: string[] | null;
  locationDescription?: string | null;
  assignedCaregiverId?: number | null;
};
