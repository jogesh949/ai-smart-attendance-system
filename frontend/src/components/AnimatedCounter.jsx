import CountUp from 'react-countup';

const AnimatedCounter = ({ end, duration = 2, className = '' }) => {
  return (
    <CountUp end={end} duration={duration} className={className} />
  );
};

export default AnimatedCounter;