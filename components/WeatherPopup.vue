<template>
  <div class="bg-black text-white p-6 rounded-lg w-full">
    <!-- 位置信息 -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-semibold">{{ location }}</h1>
        <p class="text-6xl mt-2">{{ weatherData?.temperature }}°</p>
        <p class="text-lg">{{ weatherData?.description }}</p>
      </div>
    </div>

    <!-- 详细信息面板 -->
    <div class="bg-gray-800 bg-opacity-50 rounded-lg p-4 mb-6">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <p class="text-gray-400">风速/风向</p>
          <p>{{ weatherData?.windSpeed }} mph {{ weatherData?.windDirection }}</p>
        </div>
        <div>
          <p class="text-gray-400">湿度</p>
          <p>{{ weatherData?.humidity }}%</p>
        </div>
        <div>
          <p class="text-gray-400">云量</p>
          <p>{{ weatherData?.cloudCover }}%</p>
        </div>
        <div>
          <p class="text-gray-400">能见度</p>
          <p>{{ weatherData?.visibility }} mi</p>
        </div>
        <div>
          <p class="text-gray-400">露点</p>
          <p>{{ weatherData?.dewPoint }}°</p>
        </div>
        <div>
          <p class="text-gray-400">气压</p>
          <p>{{ weatherData?.pressure }} mb</p>
        </div>
        <div>
          <p class="text-gray-400">紫外线指数</p>
          <p>{{ weatherData?.uvIndex }}</p>
        </div>
        <div>
          <p class="text-gray-400">预测强度</p>
          <p>{{ weatherData?.precipitationProbability }}%</p>
        </div>
      </div>
    </div>

    <!-- 小时预报 -->
    <div class="mb-6">
      <h2 class="text-lg mb-3">小时预报</h2>
      <div class="flex space-x-4 overflow-x-auto pb-2">
        <div v-for="hour in hourlyForecast" :key="hour.time" class="flex flex-col items-center min-w-[60px]">
          <p class="text-sm">{{ formatHour(hour.time) }}</p>
          <div class="text-2xl my-2">{{ getWeatherIcon(hour.weatherCode) }}</div>
          <p>{{ hour.temperature }}°</p>
          <p class="text-blue-400 text-sm">{{ hour.precipProbability }}%</p>
        </div>
      </div>
    </div>

    <!-- 每日预报 -->
    <div>
      <h2 class="text-lg mb-3">未来预报</h2>
      <div class="space-y-2">
        <div v-for="day in dailyForecast" :key="day.date" 
             class="flex items-center justify-between py-2 border-t border-gray-700">
          <span>{{ formatDay(day.date) }}</span>
          <div class="text-2xl">{{ getWeatherIcon(day.weatherCode) }}</div>
          <div class="flex items-center space-x-2">
            <span>{{ day.maxTemp }}°</span>
            <span class="text-gray-400">{{ day.minTemp }}°</span>
          </div>
          <span class="text-blue-400">{{ day.precipProbability }}%</span>
        </div>
      </div>
    </div>

    <!-- 日出日落信息 -->
    <div class="mt-6 text-center text-sm text-gray-400">
      <p>日出 {{ formatTime(weatherData?.sunrise) }} · 日落 {{ formatTime(weatherData?.sunset) }}</p>
    </div>

    <!-- 添加刷新按钮和更新时间 -->
    <div class="text-center text-xs text-gray-400 mt-4">
      <div class="flex items-center justify-center gap-2">
        <button 
          @click="fetchWeatherData"
          class="text-blue-500 hover:text-blue-600 flex items-center gap-1"
          :disabled="loading"
        >
          <span>刷新数据</span>
          <svg v-if="loading" class="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <!-- 加载图标 -->
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface WeatherData extends Record<string, any> {
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
  cloudCover: number
  pressure: number
  visibility: number
  dewPoint: number
  uvIndex: number
  precipitationProbability: number
  sunrise: string
  sunset: string
  windDirection: string
}

interface HourlyForecast {
  time: string
  temperature: number
  weatherCode: number
  precipProbability: number
}

interface DailyForecast {
  date: string
  weatherCode: number
  maxTemp: number
  minTemp: number
  precipProbability: number
}

// 添加地点名称
const location = ref('北京')
// 添加小时预报和每日预报的数据
const hourlyForecast = ref<HourlyForecast[]>([])
const dailyForecast = ref<DailyForecast[]>([])

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

// 将getWeatherIcon移到组件顶层，使其可以在模板中使用
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

const fetchWeatherData = async () => {
  try {
    loading.value = true
    
    const latitude = defaultLatitude
    const longitude = defaultLongitude
    
    // 添加daily.weather_code参数
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,cloud_cover,pressure_msl,visibility,dew_point_2m,precipitation,uv_index&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`
    )
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('API响应错误:', response.status, errorData)
      throw new Error(`获取天气数据失败: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('天气数据:', data)
    
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
      interval: data.current.interval || 900,
      generationTime: data.generationtime_ms,
      cloudCover: data.current.cloud_cover,
      pressure: data.current.pressure_msl,
      visibility: data.current.visibility,
      dewPoint: data.current.dew_point_2m,
      uvIndex: data.current.uv_index,
      precipitationProbability: data.current.precipitation,
      sunrise: data.daily.sunrise[0],
      sunset: data.daily.sunset[0],
      windDirection: getWindDirection(data.current.wind_direction_10m)
    }
    
    // 处理小时预报数据
    if (data.hourly) {
      hourlyForecast.value = Array.from({ length: Math.min(24, data.hourly.time.length) }, (_, index) => ({
        time: data.hourly.time[index],
        temperature: Math.round(data.hourly.temperature_2m[index]),
        weatherCode: data.hourly.weather_code[index],
        precipProbability: data.hourly.precipitation_probability[index]
      }));
    }
    
    // 处理每日预报数据
    if (data.daily) {
      dailyForecast.value = Array.from({ length: data.daily.time.length }, (_, index) => ({
        date: data.daily.time[index],
        weatherCode: data.daily.weather_code[index],
        maxTemp: Math.round(data.daily.temperature_2m_max[index]),
        minTemp: Math.round(data.daily.temperature_2m_min[index]),
        precipProbability: data.daily.precipitation_probability_max[index]
      }));
    }
    
  } catch (err) {
    console.error('获取天气数据错误:', err)
    error.value = err instanceof Error ? err.message : '获取天气数据失败'
  } finally {
    loading.value = false
  }
}

// 添加定时器引用
let refreshTimer: number | null = null

// 设置自动刷新间隔（毫秒）
const REFRESH_INTERVAL = 900000 // 15分钟 = 15 * 60 * 1000

// 启动自动刷新
const startAutoRefresh = () => {
  // 清除可能存在的旧定时器
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  
  // 设置新的定时器
  refreshTimer = window.setInterval(() => {
    fetchWeatherData()
  }, REFRESH_INTERVAL)
}

// 停止自动刷新
const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// 组件挂载时启动自动刷新
onMounted(() => {
  fetchWeatherData()
  startAutoRefresh()
})

// 组件卸载时清理定时器
onUnmounted(() => {
  stopAutoRefresh()
})

// 格式化时间的工具函数
const formatHour = (time: string) => {
  if (!time) return '--';
  return new Date(time).toLocaleTimeString('zh-CN', { hour: 'numeric' })
}

const formatDay = (date: string) => {
  if (!date) return '--';
  return new Date(date).toLocaleDateString('zh-CN', { weekday: 'long' })
}

const formatTime = (time: string | undefined) => {
  if (!time) return '--:--';
  return new Date(time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 获取风向
const getWindDirection = (degrees: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  const index = Math.round((degrees || 0) / 45) % 8
  return directions[index]
}
</script>

<style scoped>
/* 添加滚动条样式 */
.overflow-x-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

.overflow-x-auto::-webkit-scrollbar {
  height: 4px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}
</style> 