export interface OnebotProtocol {
  action: string;
  params: any;
  echo?: any;
}

export const OnebotAsyncResponse = {
  retcode: 1,
  status: 'async',
  data: null,
  error: null,
};
export const OnebotAsyncResponseString = JSON.stringify(OnebotAsyncResponse);

export function OnebotAsyncResponseWithEcho(echo: any) {
  return {
    ...OnebotAsyncResponse,
    echo,
  };
}
