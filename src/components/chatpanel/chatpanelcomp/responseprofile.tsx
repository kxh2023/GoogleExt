interface ChatResponseProfileProps {
  name: string;
  avatarUrl?: string;
}

export function ChatResponseProfile({
  name,
  avatarUrl,
}: ChatResponseProfileProps) {
  return (
    <div className="flex items-center mb-2">
      <div className="mr-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`${name} avatar`}
            className="w-8 h-8 rounded-full bg-gray-100"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 border border-gray-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a5 5 0 0 1 5 5c0 2.83-2.3 5-5 5s-5-2.17-5-5a5 5 0 0 1 5-5zm0 13c4.42 0 8 1.79 8 4v1H4v-1c0-2.21 3.58-4 8-4z" />
            </svg>
          </div>
        )}
      </div>
      <span className="font-medium text-gray-800">{name}</span>
    </div>
  );
}
