const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    name: typeof error,
    message: String(error),
  };
};

export const sendAlarm = (fnName: string, error: unknown, id: string) => {
  void fetch("http://localhost:3001/alarms", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      id,
      fnName,
      error: serializeError(error),
      firedAt: new Date().toISOString(),
    }),
  }).catch((sendError) => {
    console.error("Failed to fire alarm", sendError);
  });
};
