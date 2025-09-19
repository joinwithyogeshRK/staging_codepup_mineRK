import { Copy } from "lucide-react";
import { useState } from "react";

const CopyLinkButton = ({ link }: { link: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000); // Reset after 500ms
    } catch (err) {
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleCopy}
        className="px-1 py-1 text-gray-800 rounded-lg hover:bg-gray-300 active:scale-95 transition text-xs hover:cursor-pointer"
      >
        <Copy className="" />
      </button>
      {copied && (
        <span className="absolute bottom-[-24px] left-2 transform -translate-x-1/2 mt-2 text-success text-sm font-medium whitespace-nowrap z-10 animate-in fade-in-0 zoom-in-95 duration-300">
          Link copied!
        </span>
      )}
    </div>
  );
};

export default CopyLinkButton;
