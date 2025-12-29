import { create } from 'zustand';

export const useGameStore = create((set, get) => ({
  // Model and animation state
  model: null,
  mixer: null,
  currentAction: null,
  animations: null,
  currentAnimationIndex: -1,
  
  // Movement keys
  keys: {
    left: false,
    right: false,
    front: false,
    back: false,
    jump: false,
    run: false,
    punch: false
  },
  
  // Jump state
  isJumping: false,
  jumpVelocity: 0,

  // Actions
  setModel: (model) => set({ model }),
  setMixer: (mixer) => set({ mixer }),
  setCurrentAction: (action) => set({ currentAction: action }),
  setCurrentAnimationIndex: (index) => set({ currentAnimationIndex: index }),
  setAnimations: (animations) => set({ animations }),
  
  setKey: (key, value) => set((state) => ({
    keys: { ...state.keys, [key]: value }
  })),
  
  setJumping: (jumping) => set({ isJumping: jumping }),
  setJumpVelocity: (velocity) => set({ jumpVelocity: velocity }),
  
  // Animation switching
  switchAnimation: (animationIndex) => {
    const { mixer, animations, currentAction, currentAnimationIndex } = get();
    if (!mixer || !animations || animationIndex >= animations.length) return;
    
    // Don't switch if already playing this animation
    if (currentAnimationIndex === animationIndex) return;

    const newAction = mixer.clipAction(animations[animationIndex]);
    
    if (currentAction) {
      currentAction.fadeOut(0.2);
    }
    
    newAction.reset().fadeIn(0.2).play();
    set({ currentAction: newAction, currentAnimationIndex: animationIndex });
  }
}));