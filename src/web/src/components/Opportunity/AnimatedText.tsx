import { useState, useEffect } from "react";

interface AnimatedTextProps {
  sentences: string[];
}

const AnimatedText: React.FC<AnimatedTextProps> = ({ sentences }) => {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prevIndex) => (prevIndex + 1) % sentences.length);
        setFade(true);
      }, 500);
    }, 3000); // Change sentence every 3 seconds

    return () => clearInterval(interval);
  }, [sentences.length]);

  return (
    <div
      className={`md:text-md text-purple-soft flex h-[3rem] w-[300px] flex-col justify-center text-center text-sm font-normal transition-opacity duration-500 md:h-fit md:w-full ${
        fade ? "opacity-100" : "opacity-0"
      }`}
    >
      {sentences[index]}
    </div>
  );
};

export default AnimatedText;
