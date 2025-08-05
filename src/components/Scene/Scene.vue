<template>
  <div id="instructions">
    Поворачивайте телефон, чтобы найти цели. Тапайте по ним!
    <div id="score">Очки: 0</div>
  </div>
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { onMounted } from 'vue'

const initScene = () => {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  const renderer = new THREE.WebGLRenderer({ antialias: true })

  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)

  // Создаем куб-комнату
  const roomSize = 20
  const roomGeometry = new THREE.BoxGeometry(roomSize, roomSize, roomSize);
  const roomMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x333333,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.5
  })
  const room = new THREE.Mesh(roomGeometry, roomMaterial)
  scene.add(room)

  // Добавляем цели (красные сферы)Scene
  const targets = []
  const targetGeometry = new THREE.SphereGeometry(0.5, 32, 32)
  const targetMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 })
  
  // Создаем 6 целей по одной на каждой стене
  const positions = [
      { x: 0, y: 0, z: -roomSize/2 + 1 }, // передняя стена
      { x: 0, y: 0, z: roomSize/2 - 1 },  // задняя
      { x: -roomSize/2 + 1, y: 0, z: 0 }, // левая
      { x: roomSize/2 - 1, y: 0, z: 0 },   // правая
      { x: 0, y: roomSize/2 - 1, z: 0 },  // верх
      { x: 0, y: -roomSize/2 + 1, z: 0 }  // низ
  ]

  positions.forEach(pos => {
      const target = new THREE.Mesh(targetGeometry, targetMaterial)
      target.position.set(pos.x, pos.y, pos.z)
      scene.add(target)
      targets.push(target)
  })

  // Позиция камеры (телефона) в центре комнаты
  camera.position.set(0, 0, 0)

  // Переменные для управления
  let beta = 0  // Наклон вперед/назад
  let gamma = 0  // Наклон влево/вправо
  let score = 0

  // Обработчик событий DeviceOrientation
  window.addEventListener('deviceorientation', (event) => {
      beta = event.beta * (Math.PI / 180)  // Преобразуем в радианы
      gamma = event.gamma * (Math.PI / 180)
  })

  // Обработчик кликов (выстрелов)
  window.addEventListener('click', (event) => {
      const mouse = new THREE.Vector2(
          (event.clientX / window.innerWidth) * 2 - 1,
          -(event.clientY / window.innerHeight) * 2 + 1
      )

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouse, camera)

      const intersects = raycaster.intersectObjects(targets)
      if (intersects.length > 0) {
          // Цель поражена - перемещаем ее в случайное место
          const target = intersects[0].object
          target.position.x = (Math.random() - 0.5) * (roomSize - 2)
          target.position.y = (Math.random() - 0.5) * (roomSize - 2)
          target.position.z = (Math.random() > 0.5 ? 1 : -1) * (roomSize/2 - 1)
          
          score++
          document.getElementById('score').textContent = `Очки: ${score}`
      }
  })

  // Анимация
  function animate() {
      requestAnimationFrame(animate)
      
      // Обновляем вращение камеры на основе данных датчиков
      camera.rotation.set(
          beta,  // Наклон вперед/назад
          gamma, // Наклон влево/вправо
          0,     // Не используем compass heading
          'YXZ'  // Порядок вращения
      )
      
      renderer.render(scene, camera)
  }

  // Запрос разрешения на доступ к датчикам (для iOS 13+)
  if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
      document.body.addEventListener('click', function() {
          DeviceOrientationEvent.requestPermission()
              .then(response => {
                  if (response == 'granted') {
                      alert('Датчики активированы! Поворачивайте телефон.')
                  }
              })
              .catch(console.error)
      })
  }

  animate()

  // Обработка изменения размера окна
  window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
  })
}

onMounted(() => {
  initScene()
})
</script>
<style>
    #app { padding: 0; }
    body { margin: 0; overflow: hidden; }
    canvas { display: block; }
    #instructions {
        position: absolute;
        top: 10px;
        left: 10px;
        color: white;
        background: rgba(0,0,0,0.5);
        padding: 10px;
        font-family: Arial;
    }
</style>

