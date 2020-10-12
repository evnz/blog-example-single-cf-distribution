export const handler = async (event: any): Promise<any> => {
  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key: "Machine friendly hello world" }),
  };
};
