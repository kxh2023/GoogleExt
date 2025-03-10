interface SingleUserMsgTextProps {
  message: string;
}

export function SingleUserMsgText({ message }: SingleUserMsgTextProps) {
  return <div className="text-gray-700 text-base">{message}</div>;
}
