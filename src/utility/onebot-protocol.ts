export interface OnebotProtocol {
  action: string;
  params: any;
  echo?: any;
}

export const OnebotWsResponse = {
  retcode: 1,
  status: 'async',
  data: null,
  error: null,
};
export const OnebotWsResponseString = JSON.stringify(OnebotWsResponse);

export function OnebotWsResponseWithEcho(echo: any) {
  return {
    ...OnebotWsResponse,
    echo,
  };
}
