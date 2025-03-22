interface ChatUserProfileProps {
  username: string;
  avatarUrl?: string;
}

export function ChatUserProfile({ username, avatarUrl }: ChatUserProfileProps) {
  return (
    <div className="flex items-center mb-2">
      <div className="mr-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`${username}'s avatar`}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 border border-gray-200">
            {username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <span className="font-medium text-gray-800">{username}</span>
    </div>
  );
}
