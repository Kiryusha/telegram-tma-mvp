<template>
  <div id="instructions">
    Поворачивайте телефон, чтобы найти цели. Тапайте по ним!
    <div>Очки: {{ score }}</div>
    <div>Координаты: {{ beta }} / {{ gamma }}</div>
  </div>
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { onMounted, ref } from 'vue'

const score = ref(0)
// Переменные для управления
const beta = ref(0) // Наклон вперед/назад
const gamma = ref(0) // Наклон влево/вправо

const initScene = () => {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  const renderer = new THREE.WebGLRenderer({ antialias: true })

  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)

  // Создаем куб-комнату
  const roomSize = 20
  const roomGeometry = new THREE.BoxGeometry(roomSize, roomSize, roomSize)
  const roomMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x333333,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.5
  })
  const materials = [
    new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.3, wireframe: false }), // Правая (красная)
    new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.3, wireframe: false }), // Левая (зелёная)
    new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.3, wireframe: false }), // Верхняя (синяя)
    new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.3, wireframe: false }), // Нижняя (жёлтая)
    new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.3, wireframe: false }), // Задняя (пурпурная)
    new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.3, wireframe: false })  // Передняя (голубая)
  ]
  const room = new THREE.Mesh(roomGeometry, materials)
  room.geometry.scale(1, 1, 1)
  scene.add(room)

  // Добавляем цветные рамки для каждой стены
  const borderWidth = 0.2 // Толщина рамки
  const borderGeometry = new THREE.BoxGeometry(roomSize + borderWidth, roomSize + borderWidth, borderWidth)
  const borderPositions = [
      { x: 0, y: 0, z: roomSize/2 + borderWidth/2, color: 0xff0000 }, // Правая
      { x: 0, y: 0, z: -roomSize/2 - borderWidth/2, color: 0x00ff00 }, // Левая
      { x: 0, y: roomSize/2 + borderWidth/2, z: 0, color: 0x0000ff }, // Верхняя
      { x: 0, y: -roomSize/2 - borderWidth/2, z: 0, color: 0xffff00 }, // Нижняя
      { x: roomSize/2 + borderWidth/2, y: 0, z: 0, color: 0xff00ff }, // Задняя
      { x: -roomSize/2 - borderWidth/2, y: 0, z: 0, color: 0x00ffff }  // Передняя
  ]

  borderPositions.forEach(pos => {
      const border = new THREE.Mesh(
          borderGeometry,
          new THREE.MeshBasicMaterial({ color: pos.color, wireframe: true })
      )
      border.position.set(pos.x, pos.y, pos.z)
      scene.add(border)
  })

  // Добавляем цели (красные сферы)Scene
  const targets: THREE.Mesh[] = []
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

  // Обработчик событий DeviceOrientation
  window.addEventListener('deviceorientation', (event: DeviceOrientationEvent) => {
    beta.value = event.beta ? event.beta * (Math.PI / 180) : 0  // Преобразуем в радианы
    gamma.value = event.gamma ? event.gamma * (Math.PI / 180) : 0
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
      
      score.value += 1
    }
  })

  // Анимация
  function animate() {
    requestAnimationFrame(animate)
    
    // Обновляем вращение камеры на основе данных датчиков
    camera.rotation.set(
      beta.value,  // Наклон вперед/назад
      gamma.value, // Наклон влево/вправо
      0,     // Не используем compass heading
      'YXZ'  // Порядок вращения
    )
    
    renderer.render(scene, camera)
  }

  // Запрос разрешения на доступ к датчикам (для iOS 13+)
  // @ts-ignore
  if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
    document.body.addEventListener('click', async () => {
      // @ts-ignore
      const response: PermissionState = await DeviceOrientationEvent.requestPermission()

      if (response == 'granted') {
        alert('Датчики активированы! Поворачивайте телефон.')
      }
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
