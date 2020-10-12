export const handler = async (event: any): Promise<any> => {
  return {
    statusCode: 200,
    headers: {},
    body: "Machine friendly hello world",
  };
};
