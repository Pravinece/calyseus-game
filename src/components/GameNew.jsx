/**
 * Game Component - Multiplayer 3D Game
 * Uses gameSocketService for all multiplayer communication
 */

import * as THREE from 'three';
import { OrbitControls } from '/node_modules/three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { activateMode, deActivateMode } from './keyPress';
import { movement } from './movement';
import { useGameStore } from '../store/useGameStore';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import gameSocketService from '../services/gameSocketService';

function Game() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [otherPlayers, setOtherPlayers] = useState({}); // { socketId: { username, pos, rot, anim } }
  
  // Refs for Three.js objects
  const gameContainerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const gltfModelRef = useRef(null);
  const otherPlayerModelsRef = useRef({}); // { socketId: THREE.Object3D }
  const lastUpdateRef = useRef({ pos: [0, 0, 0], rot: [0, 0, 0], anim: 3 });

  /**
   * EFFECT 1: Initialize user and socket connection
   */
  useEffect(() => {
    const userData = sessionStorage.getItem('user');
    if (!userData) {
      navigate('/app');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    // Connect to socket server
    gameSocketService.connect();
    
    // Join room
    gameSocketService.joinRoom(roomId, parsedUser.username);
    
    // Listen for existing players in room
    gameSocketService.onRoomState((players) => {
      console.log('📊 Room state received:', players);
      setOtherPlayers(players);
    });
    
    // Listen for new players joining
    gameSocketService.onPlayerJoined((data) => {
      setOtherPlayers(prev => ({
        ...prev,
        [data.socketId]: {
          username: data.username,
          pos: data.pos,
          rot: data.rot,
          anim: data.anim
        }
      }));
    });
    
    // Listen for player updates
    gameSocketService.onPlayerUpdated((data) => {
      setOtherPlayers(prev => ({
        ...prev,
        [data.socketId]: {
          ...prev[data.socketId],
          pos: data.pos,
          rot: data.rot,
          anim: data.anim
        }
      }));
    });
    
    // Listen for players leaving
    gameSocketService.onPlayerLeft((data) => {
      setOtherPlayers(prev => {
        const newPlayers = { ...prev };
        delete newPlayers[data.socketId];
        return newPlayers;
      });
    });
    
    // Cleanup on unmount
    return () => {
      gameSocketService.leaveRoom();
      gameSocketService.disconnect();
    };
  }, [roomId, navigate]);

  /**
   * EFFECT 2: Create/Update other player models in scene
   */
  useEffect(() => {
    if (!sceneRef.current || !gltfModelRef.current) return;
    
    const scene = sceneRef.current;
    const gltf = gltfModelRef.current;
    
    // Create models for new players
    Object.entries(otherPlayers).forEach(([socketId, playerData]) => {
      if (!otherPlayerModelsRef.current[socketId]) {
        console.log('🎨 Creating model for player:', playerData.username);
        
        // Clone the GLTF model
        const playerModel = gltf.scene.clone();
        playerModel.position.set(...playerData.pos);
        playerModel.rotation.set(...playerData.rot);
        
        // Make other players red for visibility
        playerModel.traverse((child) => {
          if (child.isMesh) {
            child.material = child.material.clone();
            child.material.color.setHex(0xff0000);
          }
        });
        
        // Add username label
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        context.fillStyle = 'rgba(0,0,0,0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'white';
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        context.fillText(playerData.username, canvas.width / 2, 40);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(0, 3, 0);
        sprite.scale.set(2, 0.5, 1);
        playerModel.add(sprite);
        
        // Add to scene and store reference
        scene.add(playerModel);
        otherPlayerModelsRef.current[socketId] = playerModel;
      }
    });
    
    // Remove models for players that left
    Object.keys(otherPlayerModelsRef.current).forEach(socketId => {
      if (!otherPlayers[socketId]) {
        console.log('🗑️ Removing model for player:', socketId);
        scene.remove(otherPlayerModelsRef.current[socketId]);
        delete otherPlayerModelsRef.current[socketId];
      }
    });
  }, [otherPlayers]);

  /**
   * EFFECT 3: Initialize Three.js scene
   */
  useEffect(() => {
    if (!gameContainerRef.current) return;

    // Setup renderer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    gameContainerRef.current.appendChild(renderer.domElement);

    // Setup camera
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100);
    camera.position.set(0, 4, 20);
    cameraRef.current = camera;

    // Setup scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.add(camera);

    // Add lights
    const ambientLight = new THREE.AmbientLight('white', 1);
    scene.add(ambientLight);

    // Add grid helper
    const gridHelper = new THREE.GridHelper(20);
    scene.add(gridHelper);

    // Add orbit controls
    const orbitControl = new OrbitControls(camera, renderer.domElement);

    // Add floor
    const floorGeo = new THREE.PlaneGeometry(20, 20);
    const floorMat = new THREE.MeshBasicMaterial({ color: 'white' });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -0.5 * Math.PI;
    scene.add(floor);

    // Get Zustand store actions
    const { setModel, setMixer, setCurrentAction, setAnimations, setCurrentAnimationIndex } = useGameStore.getState();

    // Load player model
    const loader = new GLTFLoader();
    loader.load('/models/person.glb', (gltf) => {
      gltfModelRef.current = gltf;
      
      const model = gltf.scene.clone();
      const animations = gltf.animations;
      scene.add(model);

      const mixer = new THREE.AnimationMixer(model);
      const currentAction = mixer.clipAction(animations[3]);
      currentAction.play();

      setModel(model);
      setMixer(mixer);
      setAnimations(animations);
      setCurrentAction(currentAction);
      setCurrentAnimationIndex(3);
    });

    // Keyboard event handlers
    const handleKeyDown = (e) => {
      try {
        activateMode(e);
      } catch (error) {
        console.warn('Key down error:', error);
      }
    };

    const handleKeyUp = (e) => {
      try {
        deActivateMode(e);
      } catch (error) {
        console.warn('Key up error:', error);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Animation loop
    let animationId;
    function animate() {
      animationId = window.requestAnimationFrame(animate);
      
      try {
        // Update player movement
        movement(camera);
        
        // Get current player state
        const { model, currentAnimationIndex } = useGameStore.getState();
        if (model) {
          const currentPos = [model.position.x, model.position.y, model.position.z];
          const currentRot = [model.rotation.x, model.rotation.y, model.rotation.z];
          const currentAnim = currentAnimationIndex;
          
          const lastUpdate = lastUpdateRef.current;
          
          // Send update if position/rotation/animation changed significantly
          if (
            Math.abs(currentPos[0] - lastUpdate.pos[0]) > 0.1 ||
            Math.abs(currentPos[2] - lastUpdate.pos[2]) > 0.1 ||
            Math.abs(currentRot[1] - lastUpdate.rot[1]) > 0.1 ||
            currentAnim !== lastUpdate.anim
          ) {
            gameSocketService.updatePlayer(currentPos, currentRot, currentAnim);
            lastUpdateRef.current = { pos: currentPos, rot: currentRot, anim: currentAnim };
          }
        }
        
        // Update other players' positions and rotations
        Object.entries(otherPlayers).forEach(([socketId, playerData]) => {
          const playerModel = otherPlayerModelsRef.current[socketId];
          if (playerModel) {
            playerModel.position.set(...playerData.pos);
            playerModel.rotation.set(...playerData.rot);
          }
        });
        
        orbitControl.update();
        renderer.render(scene, camera);
      } catch (error) {
        console.warn('Animation error:', error);
      }
    }

    animate();

    // Cleanup
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      try {
        // Remove other player models
        Object.values(otherPlayerModelsRef.current).forEach(playerModel => {
          scene.remove(playerModel);
        });
        otherPlayerModelsRef.current = {};
        
        if (gameContainerRef.current && renderer.domElement && gameContainerRef.current.contains(renderer.domElement)) {
          gameContainerRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      } catch (error) {
        console.warn('Cleanup error:', error);
      }
    };
  }, [otherPlayers]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div ref={gameContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

export default Game;
