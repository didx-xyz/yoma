import { FaInstagram, FaYoutube, FaLinkedin } from "react-icons/fa";

export const SocialMediaLinks: React.FC<{
  tabIndex?: number;
}> = ({ tabIndex }) => {
  return (
    <div className="flex items-center justify-center gap-4">
      <a
        href="https://www.instagram.com/yoma.world/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-600 hover:text-gray-900"
        aria-label="Instagram"
        tabIndex={tabIndex}
        title="Follow us on Instagram!"
      >
        <FaInstagram className="h-6 w-6" />
      </a>
      <a
        href="https://www.youtube.com/@Yoma.World.2019"
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-600 hover:text-gray-900"
        aria-label="YouTube"
        tabIndex={tabIndex}
        title="Follow us on YouTube!"
      >
        <FaYoutube className="h-6 w-6" />
      </a>
      <a
        href="https://www.linkedin.com/company/yoma-world/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-600 hover:text-gray-900"
        aria-label="LinkedIn"
        tabIndex={tabIndex}
        title="Follow us on LinkedIn!"
      >
        <FaLinkedin className="h-6 w-6" />
      </a>
    </div>
  );
};
