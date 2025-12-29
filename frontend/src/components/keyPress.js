import { useGameStore } from '../store/useGameStore';

export const activateMode = (event) => {
  const { setKey, switchAnimation } = useGameStore.getState();
  
  if(event.key === 'a') setKey('left', true);
  if(event.key === 's') setKey('back', true);
  if(event.key === 'w') setKey('front', true);
  if(event.key === 'd') setKey('right', true);
  if(event.key === 'Shift') setKey('run', true);
  if(event.key === ' ') {
    event.preventDefault();
    setKey('jump', true);
  }
  if(event.key === 'Enter') {
    event.preventDefault();
    setKey('punch', true);
    switchAnimation(8); // Punch animation
  }
}

export const deActivateMode = (event) => {
  const setKey = useGameStore.getState().setKey;
  
  if(event.key === 'a') setKey('left', false);
  if(event.key === 's') setKey('back', false);
  if(event.key === 'w') setKey('front', false);
  if(event.key === 'd') setKey('right', false);
  if(event.key === 'Shift') setKey('run', false);
  if(event.key === ' ') setKey('jump', false);
  if(event.key === 'Enter') setKey('punch', false);
}