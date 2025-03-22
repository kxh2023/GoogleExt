interface SingleResponseMsgTextProps {
  message: string;
  isMarkdown?: boolean;
}

export function SingleResponseMsgText({
  message,
  isMarkdown = false,
}: SingleResponseMsgTextProps) {
  // For simplicity, we're just rendering the text directly
  // In a real implementation, you would use a markdown parser for isMarkdown=true

  if (!isMarkdown) {
    return (
      <div className="text-gray-700 text-base whitespace-pre-wrap">
        {message}
      </div>
    );
  }

  // Here we're doing a very basic markdown-like rendering for bullet points
  // In a real implementation, you'd use a proper markdown library
  const lines = message.split("\n");

  return (
    <div className="text-gray-700 text-base whitespace-pre-wrap">
      {lines.map((line, index) => {
        if (line.trim().startsWith("• ")) {
          return (
            <div key={index} className="flex">
              <span className="mr-2">•</span>
              <span>{line.trim().substring(2)}</span>
            </div>
          );
        }
        return <div key={index}>{line}</div>;
      })}
    </div>
  );
}
