const transition = {
  enter: { opacity: 0, filter: 'blur(12px)' },
  center: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(8px)' }
};

export default transition;

