import { ChatUserProfile } from "./userprofile";
import { SingleUserMsgText } from "./singleusermsgtext";

interface SingleUserMsgBoxProps {
  username: string;
  avatarUrl?: string;
  message: string;
}

export function SingleUserMsgBox({
  username,
  avatarUrl,
  message,
}: SingleUserMsgBoxProps) {
  return (
    <div className="py-4 px-6">
      <ChatUserProfile username={username} avatarUrl={avatarUrl} />
      <SingleUserMsgText message={message} />
    </div>
  );
}
