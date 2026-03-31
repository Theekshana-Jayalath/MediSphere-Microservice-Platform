export const generateRoomName = (appointmentId) => {
  return `medisphere-${appointmentId}`;
};

export const generateMeetingLink = (roomName) => {
  return `https://meet.jit.si/${roomName}`;
};

export const calculateSessionCounts = (sessions) => {
  const counts = {
    total: sessions.length,
    pending: 0,
    confirmed: 0,
  };

  for (const session of sessions) {
    if (counts[session.status] !== undefined) {
      counts[session.status] += 1;
    }
  }

  return counts;
};