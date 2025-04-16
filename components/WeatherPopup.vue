<template>
  <div class="bg-white rounded-lg p-6 w-full h-full flex justify-center items-center shadow-lg">
   
    
    <div v-if="loading" class="flex justify-center items-center h-32">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
    
    <div v-else-if="error" class="text-red-500 text-center">
      {{ error }}
    </div>
    
    <div v-else class="space-y-4">
      <p class="text-sm text-gray-500 mb-2">{{ weatherData?.date }}</p>
      
      <div class="flex items-center justify-between">
        <div>
          <p class="text-2xl font-bold">{{ weatherData?.temperature }}°C</p>
          <p class="text-gray-600">{{ weatherData?.description }}</p>
        </div>
        <div class="text-5xl">{{ weatherData?.icon }}</div>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-gray-100 p-3 rounded-lg">
          <p class="text-sm text-gray-600">湿度</p>
          <p class="font-semibold">{{ weatherData?.humidity }}%</p>
        </div>
        <div class="bg-gray-100 p-3 rounded-lg">
          <p class="text-sm text-gray-600">风速</p>
          <p class="font-semibold">{{ weatherData?.windSpeed }} km/h</p>
        </div>
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
  date: string
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
    
    // 使用北京的经纬度，忽略传入的值
    const latitude = defaultLatitude
    const longitude = defaultLongitude
    
    console.log('请求天气数据(北京):', latitude, longitude)
    
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`
    )
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('API响应错误:', response.status, errorData)
      throw new Error(`获取天气数据失败: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('data', data)
    
    // 获取当前日期和时间
    const now = new Date()
    const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit'
    })
    const formattedDate = dateFormatter.format(now)
    
    // 使用类型断言确保weatherCode是有效键
    const weatherCode = data.current.weather_code as number
    
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
      date: formattedDate
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