<template>
  <div class="bg-white rounded-lg p-6 w-full h-full flex justify-center items-center shadow-lg">
   
    
    <div v-if="loading" class="flex justify-center items-center h-32">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
    
    <div v-else-if="error" class="text-red-500 text-center">
      {{ error }}
    </div>
    
    <div v-else class="space-y-6 w-full max-w-md">
      <!-- 位置信息 -->
      <div class="text-center">
        <h2 class="text-xl font-semibold">北京天气</h2>
        <p class="text-sm text-gray-500">
          经度: {{ weatherData?.longitude }}° / 纬度: {{ weatherData?.latitude }}°
        </p>
        <p class="text-sm text-gray-500">海拔: {{ weatherData?.elevation }}米</p>
      </div>

      <!-- 时间信息 -->
      <div class="text-center">
        <p class="text-sm text-gray-600">观测时间: {{ weatherData?.time }}</p>
        <p class="text-sm text-gray-500">时区: {{ weatherData?.timezone }} ({{ weatherData?.timezone_abbreviation }})</p>
        <p class="text-xs text-gray-400">数据更新间隔: {{ weatherData?.interval }}秒</p>
      </div>
      
      <!-- 主要天气信息 -->
      <div class="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
        <div>
          <p class="text-3xl font-bold">{{ weatherData?.temperature }}°C</p>
          <p class="text-gray-600">{{ weatherData?.description }}</p>
        </div>
        <div class="text-6xl">{{ weatherData?.icon }}</div>
      </div>
      
      <!-- 详细信息网格 -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-gray-100 p-4 rounded-lg">
          <p class="text-sm text-gray-600">湿度</p>
          <p class="font-semibold">{{ weatherData?.humidity }}%</p>
          <p class="text-xs text-gray-500">相对湿度(2m高度)</p>
        </div>
        <div class="bg-gray-100 p-4 rounded-lg">
          <p class="text-sm text-gray-600">风速</p>
          <p class="font-semibold">{{ weatherData?.windSpeed }} km/h</p>
          <p class="text-xs text-gray-500">10m高度测量</p>
        </div>
      </div>

      <!-- 数据来源信息 -->
      <div class="text-center text-xs text-gray-400">
        <p>数据生成时间: {{ weatherData?.generationTime }}ms</p>
        <p>数据来源: Open-Meteo API</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface WeatherData {
  temperature: number
  description: string
  humidity: number
  windSpeed: number
  icon: string
  time: string
  latitude: number
  longitude: number
  elevation: number
  timezone: string
  timezone_abbreviation: string
  interval: number
  generationTime: number
}

const props = defineProps<{
  latitude?: number
  longitude?: number
}>()

// 使用北京的经纬度
const defaultLatitude = 39.9042
const defaultLongitude = 116.4074

const emit = defineEmits<{
  (e: 'close'): void
}>()

const loading = ref(true)
const error = ref('')
const weatherData = ref<WeatherData | null>(null)

const fetchWeatherData = async () => {
  try {
    loading.value = true
    
    const latitude = defaultLatitude
    const longitude = defaultLongitude
    
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`
    )
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('API响应错误:', response.status, errorData)
      throw new Error(`获取天气数据失败: ${response.status}`)
    }
    
    const data = await response.json()
    const weatherCode = data.current.weather_code as number
    
    // 格式化时间
    const observationTime = new Date(data.current.time)
    const timeFormatter = new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: data.timezone
    })
    
    // 使用Record<number, string>类型定义weatherDescriptions
    const weatherDescriptions: Record<number, string> = {
      0: '晴天',
      1: '基本晴朗',
      2: '部分多云',
      3: '多云',
      45: '雾',
      48: '雾凇',
      51: '小雨',
      53: '中雨',
      55: '大雨',
      61: '小雨',
      63: '中雨',
      65: '大雨',
      71: '小雪',
      73: '中雪',
      75: '大雪',
      77: '冰雹',
      80: '小雨',
      81: '中雨',
      82: '大雨',
      85: '小雪',
      86: '大雪',
      95: '雷雨',
      96: '雷雨带冰雹',
      99: '雷雨带冰雹'
    }
    
    // 安全访问描述
    const description = weatherCode in weatherDescriptions 
      ? weatherDescriptions[weatherCode] 
      : '未知';
    
    // 使用内置天气图标映射
    const getWeatherIcon = (code: number): string => {
      // 根据weather_code选择合适的图标
      const iconMapping: Record<number, string> = {
        0: '☀️', // 晴天
        1: '🌤️', // 基本晴朗
        2: '⛅', // 部分多云
        3: '☁️', // 多云
        45: '🌫️', // 雾
        48: '🌫️', // 雾凇
        51: '🌦️', // 小雨
        53: '🌧️', // 中雨
        55: '🌧️', // 大雨
        61: '🌦️', // 小雨
        63: '🌧️', // 中雨
        65: '🌧️', // 大雨
        71: '🌨️', // 小雪
        73: '🌨️', // 中雪
        75: '❄️', // 大雪
        77: '🌨️', // 冰雹
        80: '🌦️', // 小雨
        81: '🌧️', // 中雨
        82: '🌧️', // 大雨
        85: '🌨️', // 小雪
        86: '❄️', // 大雪
        95: '⛈️', // 雷雨
        96: '⛈️', // 雷雨带冰雹
        99: '⛈️'  // 雷雨带冰雹
      }
      
      return iconMapping[code] || '❓'; // 默认问号图标
    }
    
    weatherData.value = {
      temperature: data.current.temperature_2m,
      description: description,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      icon: getWeatherIcon(weatherCode),
      time: timeFormatter.format(observationTime),
      latitude: data.latitude,
      longitude: data.longitude,
      elevation: data.elevation,
      timezone: data.timezone,
      timezone_abbreviation: data.timezone_abbreviation,
      interval: data.current.interval,
      generationTime: data.generationtime_ms
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '获取天气数据失败'
  } finally {
    loading.value = false
  }
}

onMounted(fetchWeatherData)
</script>

<style scoped>
/* 这里可以添加一些自定义样式 */
</style> 