const transition = {
  enter: { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
  center: { opacity: 1, clipPath: 'inset(0 0 0 0)' },
  exit: { opacity: 0, clipPath: 'inset(0 0 0 100%)' }
};

export default transition;

