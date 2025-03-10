import { ChatResponseProfile } from "./responseprofile";
import { SingleResponseMsgText } from "./singleresponsemsgtext";

interface SingleResponseMsgBoxProps {
  name: string;
  avatarUrl?: string;
  message: string;
  isMarkdown?: boolean;
  actions?: boolean;
}

export function SingleResponseMsgBox({
  name,
  avatarUrl,
  message,
  isMarkdown = false,
  actions = true,
}: SingleResponseMsgBoxProps) {
  return (
    <div className="py-4 px-6 bg-gray-200 border border-gray-200 rounded-md shadow-sm">
      <ChatResponseProfile name={name} avatarUrl={avatarUrl} />
      <SingleResponseMsgText message={message} isMarkdown={isMarkdown} />

      {actions && (
        <div className="flex mt-4 space-x-2">
          <button className="p-1 text-gray-500 hover:text-gray-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"></path>
              <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
            </svg>
          </button>
          <button className="p-1 text-gray-500 hover:text-gray-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"></path>
              <path d="M17 2h2a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path>
            </svg>
          </button>
          <button className="p-1 text-gray-500 hover:text-gray-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
