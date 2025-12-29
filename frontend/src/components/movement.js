import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';

const clock = new THREE.Clock();

export function movement(camera) {
  const state = useGameStore.getState();
  const { model, keys, mixer, switchAnimation, isJumping, jumpVelocity, setJumping, setJumpVelocity } = state;
  
  if (!model || !mixer) return;

  const delta = clock.getDelta();
  const moveSpeed = keys.run ? 0.15 : 0.08;
  const rotationSpeed = 0.15;
  const gravity = -0.02;
  const jumpPower = 0.3;
  
  // Jump logic
  if (keys.jump && !isJumping && model.position.y <= 0) {
    setJumping(true);
    setJumpVelocity(jumpPower);
    switchAnimation(4); // Jump animation
  }
  
  if (isJumping) {
    model.position.y += jumpVelocity;
    setJumpVelocity(jumpVelocity + gravity);
    
    if (model.position.y <= 0) {
      model.position.y = 0;
      setJumping(false);
      setJumpVelocity(0);
      switchAnimation(6); // Landing animation
      setTimeout(() => {
        const currentState = useGameStore.getState();
        if (!currentState.keys.punch) currentState.switchAnimation(3);
      }, 500);
    }
    mixer.update(delta);
    return;
  }
  
  // Skip movement if punching
  if (keys.punch) {
    mixer.update(delta);
    return;
  }
  
  // Movement direction
  const direction = new THREE.Vector3();
  const cameraDirection = new THREE.Vector3();
  camera.getWorldDirection(cameraDirection);
  cameraDirection.y = 0;
  cameraDirection.normalize();
  
  const cameraRight = new THREE.Vector3();
  cameraRight.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0));
  
  // Calculate movement direction based on camera
  if (keys.front) direction.add(cameraDirection);
  if (keys.back) direction.sub(cameraDirection);
  if (keys.left) direction.sub(cameraRight);
  if (keys.right) direction.add(cameraRight);
  
  const isMoving = direction.length() > 0;
  
  if (isMoving) {
    direction.normalize();
    
    // Move model
    model.position.add(direction.multiplyScalar(moveSpeed));
    
    // Rotate model to face movement direction
    const targetRotation = Math.atan2(direction.x, direction.z);
    model.rotation.y = THREE.MathUtils.lerp(model.rotation.y, targetRotation, rotationSpeed);
    
    // Switch to correct animation
    switchAnimation(keys.run ? 9 : 10); // Run or walk
  } else {
    // Switch to idle animation
    switchAnimation(3);
  }
  
  // Update mixer
  mixer.update(delta);
}


