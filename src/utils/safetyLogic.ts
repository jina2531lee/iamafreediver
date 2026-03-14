export type SafetyLevel = 'Safe' | 'Caution' | 'Danger';

export type SafetyAssessment = {
  level: SafetyLevel;
  color: 'green' | 'yellow' | 'red';
  message: string;
};

export type SafetyInput = {
  windSpeed: number;
  swellHeight: number;
};

export const getSafetyAssessment = ({
  windSpeed,
  swellHeight,
}: SafetyInput): SafetyAssessment => {
  // Rules:
  // Safe (Green): wind < 8 m/s AND swell < 1.0 m
  // Caution (Yellow): 8–12 m/s OR 1.0–1.5 m
  // Danger (Red): wind > 12 m/s OR swell > 1.5 m

  if (windSpeed < 8 && swellHeight < 1.0) {
    return {
      level: 'Safe',
      color: 'green',
      message:
        'Conditions look calm. Still apply conservative depth and buddy protocols.',
    };
  }

  if (
    (windSpeed >= 8 && windSpeed <= 12) ||
    (swellHeight >= 1.0 && swellHeight <= 1.5)
  ) {
    return {
      level: 'Caution',
      color: 'yellow',
      message:
        'Challenging conditions. Limit depth, increase surface interval, and dive only with an experienced buddy.',
    };
  }

  return {
    level: 'Danger',
    color: 'red',
    message:
      'High risk conditions. Strongly consider cancelling the session or moving to a safer site.',
  };
};

