import * as THREE from 'three';
import { OrbitControls } from '/node_modules/three/examples/jsm/controls/OrbitControls.js'
import {GLTFLoader} from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js'
import { activateMode, deActivateMode } from './keyPress';
import { movement } from './movement';
import { useGameStore } from '../store/useGameStore';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import colyseusService from '../services/colyseusService';

function GameColyseus() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState({});
  const [user, setUser] = useState(null);
  const gameContainerRef = useRef(null);
  const lastPositionRef = useRef([0, 0, 0]);
  const lastRotationRef = useRef([0, 0, 0]);
  const otherPlayersRef = useRef({});
  const sceneRef = useRef(null);
  const gltfModelRef = useRef(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const userData = sessionStorage.getItem('user');
    if (!userData) {
      navigate('/app');
      return;
    }
    setUser(JSON.parse(userData));

    const connectToColyseus = async () => {
      try {
        // Setup Colyseus listeners before joining
        colyseusService.onRoomState((players) => {
          console.log('📊 Initial room state:', Object.keys(players).length, 'players');
          setPlayers(players);
        });

        colyseusService.onPlayerJoined((data) => {
          console.log('👤 Player joined:', data.username);
          setPlayers(prev => ({
            ...prev,
            [data.sessionId]: {
              username: data.username,
              position: data.position,
              rotation: data.rotation
            }
          }));
        });

        colyseusService.onPlayerUpdated((data) => {
          console.log('📍 Player updated:', data.username, data.position);
          setPlayers(prev => ({
            ...prev,
            [data.sessionId]: {
              username: data.username,
              position: data.position,
              rotation: data.rotation,
              animation: data.animation
            }
          }));
        });

        colyseusService.onPlayerLeft((data) => {
          console.log('👋 Player left:', data.sessionId);
          setPlayers(prev => {
            const newPlayers = { ...prev };
            delete newPlayers[data.sessionId];
            return newPlayers;
          });
        });

        // Join room
        await colyseusService.joinRoom(JSON.parse(userData).username, roomId);
        setConnected(true);
      } catch (error) {
        console.error('Failed to connect to Colyseus:', error);
        navigate('/dashboard');
      }
    };

    connectToColyseus();

    return () => {
      colyseusService.disconnect();
      setConnected(false);
    };
  }, [roomId, navigate]);

  // Handle player creation when players state changes
  useEffect(() => {
    if (!sceneRef.current || !gltfModelRef.current) return;

    const createOtherPlayer = (sessionId, playerData) => {
      if (otherPlayersRef.current[sessionId]) return; // Already exists
      
      console.log('Creating player:', playerData.username, playerData.position);
      const otherPlayerModel = gltfModelRef.current.scene.clone();
      otherPlayerModel.position.set(
        playerData.position[0], 
        playerData.position[1], 
        playerData.position[2]
      );
      
      // Make other players red for visibility
      otherPlayerModel.traverse((child) => {
        if (child.isMesh) {
          child.material = child.material.clone();
          child.material.color.setHex(0xff0000); // Red color for other players
        }
      });
      
      sceneRef.current.add(otherPlayerModel);
      otherPlayersRef.current[sessionId] = otherPlayerModel;
      
      console.log('Player created successfully:', playerData.username);
    };

    // Create new players (exclude self)
    Object.entries(players).forEach(([sessionId, playerData]) => {
      if (sessionId !== colyseusService.getSessionId()) {
        createOtherPlayer(sessionId, playerData);
      }
    });

    // Remove players that left
    Object.keys(otherPlayersRef.current).forEach(sessionId => {
      if (!players[sessionId]) {
        console.log('Removing player:', sessionId);
        sceneRef.current.remove(otherPlayersRef.current[sessionId]);
        delete otherPlayersRef.current[sessionId];
      }
    });
  }, [players]);

  useEffect(() => {
    if (!gameContainerRef.current) return;

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    gameContainerRef.current.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100);
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    camera.position.set(0, 4, 20);
    scene.add(camera);

    const Alight = new THREE.AmbientLight('white', 1);
    scene.add(Alight);

    const gridHelper = new THREE.GridHelper(20);
    scene.add(gridHelper);
    const orbitcontrol = new OrbitControls(camera, renderer.domElement);

    const plane1geo = new THREE.PlaneGeometry(20, 20);
    const plane1mat = new THREE.MeshBasicMaterial({ color: 'white' });
    const floor = new THREE.Mesh(plane1geo, plane1mat);
    floor.rotation.x = -0.5 * Math.PI;
    scene.add(floor);

    const { setModel, setMixer, setCurrentAction, setAnimations, setCurrentAnimationIndex } = useGameStore.getState();

    const loader = new GLTFLoader();
    
    // Load main player model
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
      setModelLoaded(true);
      console.log('✅ Model loaded and ready');
    });

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

    let animationId;
    function animate() {
      animationId = window.requestAnimationFrame(animate);
      try {
        // Only call movement if model is loaded
        if (modelLoaded) {
          movement(camera);
        }
        
        // Check for position/rotation changes and send to Colyseus
        const { model, currentAnimationIndex } = useGameStore.getState();
        if (model && connected) {
          const currentPos = [model.position.x, model.position.y, model.position.z];
          const currentRot = [model.rotation.x, model.rotation.y, model.rotation.z];
          const lastPos = lastPositionRef.current;
          const lastRot = lastRotationRef.current;
          
          // Only send if position or rotation changed significantly
          if (Math.abs(currentPos[0] - lastPos[0]) > 0.1 || 
              Math.abs(currentPos[2] - lastPos[2]) > 0.1 ||
              Math.abs(currentRot[1] - lastRot[1]) > 0.1) {
            
            console.log('📤 Sending position:', currentPos);
            colyseusService.updatePlayer(currentPos, currentRot, currentAnimationIndex);
            lastPositionRef.current = currentPos;
            lastRotationRef.current = currentRot;
          }
        }
        
        // Update other players positions
        Object.entries(players).forEach(([sessionId, playerData]) => {
          if (otherPlayersRef.current[sessionId] && sessionId !== colyseusService.getSessionId()) {
            const playerModel = otherPlayersRef.current[sessionId];
            playerModel.position.set(
              playerData.position[0], 
              playerData.position[1], 
              playerData.position[2]
            );
            if (playerData.rotation) {
              playerModel.rotation.set(
                playerData.rotation[0],
                playerData.rotation[1], 
                playerData.rotation[2]
              );
            }
          }
        });
        
        orbitcontrol.update();
        renderer.render(scene, camera);
      } catch (error) {
        console.warn('Animation error:', error);
      }
    }

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      try {
        // Remove other players
        Object.values(otherPlayersRef.current).forEach(playerModel => {
          scene.remove(playerModel);
        });
        otherPlayersRef.current = {};
        
        if (gameContainerRef.current && renderer.domElement && gameContainerRef.current.contains(renderer.domElement)) {
          gameContainerRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      } catch (error) {
        console.warn('Cleanup error:', error);
      }
    };
  }, [connected, modelLoaded]);
  
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div ref={gameContainerRef} style={{ width: '100%', height: '100%' }} />
      {!connected && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px'
        }}>
          Connecting to Colyseus server...
        </div>
      )}
      {connected && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px'
        }}>
          Connected | Players: {Object.keys(players).length} | Room: {roomId}
        </div>
      )}
    </div>
  )
}

export default GameColyseus