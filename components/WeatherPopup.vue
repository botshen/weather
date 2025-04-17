<template>
  <div class="weather-popup bg-gray-100 text-gray-800 rounded-xl shadow-2xl max-h-[600px] w-[420px] flex flex-col overflow-hidden">
    <!-- 顶部标题栏 -->
    <div class="bg-gray-700 text-white py-3 px-4 flex justify-between items-center">
      <div class="flex items-center">
        <h1 class="text-xl font-medium">{{ location }} 天气</h1>
        <span class="ml-2 text-xs text-gray-300">{{ weatherData?.time }}</span>
      </div>
      <button 
        @click="fetchWeatherData"
        class="text-gray-300 hover:text-white flex items-center text-sm"
        :disabled="loading"
      >
        <svg v-if="loading" class="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>刷新</span>
      </button>
    </div>
    
    <!-- 内容区域 - 使用可滚动容器 -->
    <div class="overflow-y-auto custom-scrollbar flex-grow">
      <!-- 主要天气信息 -->
      <div class="p-4 border-b border-gray-200">
        <div class="flex items-center">
          <div class="text-6xl mr-4">{{ getWeatherIcon(weatherData?.weatherCode || 0) }}</div>
          <div>
            <p class="text-5xl font-light">{{ weatherData?.temperature }}°</p>
            <p class="text-base mt-1 text-gray-600">{{ weatherData?.description }}</p>
          </div>
        </div>
      </div>
      
      <!-- 日出日落信息 -->
      <div class="px-4 py-2 bg-gray-50 border-b border-gray-200 flex justify-between text-sm text-gray-600">
        <span>日出: {{ formatTime(weatherData?.sunrise) }}</span>
        <span>日落: {{ formatTime(weatherData?.sunset) }}</span>
      </div>

      <!-- 小时预报 -->
      <div class="p-4 border-b border-gray-200">
        <h2 class="text-sm uppercase font-semibold text-gray-500 mb-3">小时预报</h2>
        <div class="flex space-x-4 overflow-x-auto custom-scrollbar-x pb-2">
          <div v-for="hour in hourlyForecast" :key="hour.time" class="flex flex-col items-center min-w-[60px]">
            <p class="text-xs text-gray-600">{{ formatHour(hour.time) }}</p>
            <div class="text-xl my-1">{{ getWeatherIcon(hour.weatherCode) }}</div>
            <p class="font-medium">{{ hour.temperature }}°</p>
            <p class="text-blue-600 text-xs">{{ hour.precipProbability }}%</p>
          </div>
        </div>
      </div>

      <!-- 详细信息面板 -->
      <div class="p-4 border-b border-gray-200">
        <h2 class="text-sm uppercase font-semibold text-gray-500 mb-3">当前详情</h2>
        <div class="grid grid-cols-2 gap-y-3 gap-x-6">
          <div class="flex items-center">
            <span class="w-20 text-xs text-gray-500">风速/风向</span>
            <span class="text-sm">{{ weatherData?.windSpeed }} mph {{ weatherData?.windDirection }}</span>
          </div>
          <div class="flex items-center">
            <span class="w-20 text-xs text-gray-500">湿度</span>
            <span class="text-sm">{{ weatherData?.humidity }}%</span>
          </div>
          <div class="flex items-center">
            <span class="w-20 text-xs text-gray-500">云量</span>
            <span class="text-sm">{{ weatherData?.cloudCover }}%</span>
          </div>
          <div class="flex items-center">
            <span class="w-20 text-xs text-gray-500">能见度</span>
            <span class="text-sm">{{ weatherData?.visibility }} mi</span>
          </div>
          <div class="flex items-center">
            <span class="w-20 text-xs text-gray-500">露点</span>
            <span class="text-sm">{{ weatherData?.dewPoint }}°</span>
          </div>
          <div class="flex items-center">
            <span class="w-20 text-xs text-gray-500">气压</span>
            <span class="text-sm">{{ weatherData?.pressure }} mb</span>
          </div>
          <div class="flex items-center">
            <span class="w-20 text-xs text-gray-500">紫外线</span>
            <span class="text-sm">{{ weatherData?.uvIndex }}</span>
          </div>
          <div class="flex items-center">
            <span class="w-20 text-xs text-gray-500">降水概率</span>
            <span class="text-sm">{{ weatherData?.precipitationProbability }}%</span>
          </div>
        </div>
      </div>

      <!-- 每日预报 -->
      <div class="p-4">
        <h2 class="text-sm uppercase font-semibold text-gray-500 mb-3">未来预报</h2>
        <div class="space-y-1">
          <div v-for="day in dailyForecast" :key="day.date" 
              class="flex items-center py-2 border-t border-gray-200 text-sm">
            <span class="w-16">{{ formatDay(day.date) }}</span>
            <div class="text-xl mx-4">{{ getWeatherIcon(day.weatherCode) }}</div>
            <div class="flex items-center space-x-2 ml-auto">
              <span class="font-medium">{{ day.maxTemp }}°</span>
              <span class="text-gray-500">{{ day.minTemp }}°</span>
            </div>
            <span class="text-blue-600 ml-4 w-8 text-right">{{ day.precipProbability }}%</span>
          </div>
        </div>
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

// 添加响应式经纬度
const currentLatitude = ref<number | null>(null)
const currentLongitude = ref<number | null>(null)

const emit = defineEmits<{
  (e: 'close'): void
}>()

const loading = ref(true)
const error = ref('')
const weatherData = ref<WeatherData | null>(null)

// 添加简单的缓存机制
const locationCache = new Map<string, string>()

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

// 获取地理位置
const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持地理定位'))
      return
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    })
  })
}

// 修改 getLocationName 函数，添加缓存
const getLocationName = async (latitude: number, longitude: number): Promise<string> => {
  // 生成缓存 key
  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`
  
  // 检查缓存
  if (locationCache.has(cacheKey)) {
    return locationCache.get(cacheKey)!
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=zh-CN`,
      {
        headers: {
          'User-Agent': 'WeatherExtension/1.0' // OpenStreetMap 要求提供 User-Agent
        }
      }
    )

    if (!response.ok) {
      throw new Error('获取地点名称失败')
    }

    const data = await response.json()
    
    // 根据返回数据构建地点名称
    // address 对象包含多个层级的地理信息
    const address = data.address
    if (address) {
      // 优先使用城市名称
      if (address.city) {
        locationCache.set(cacheKey, address.city)
        return address.city
      }
      // 如果没有城市，尝试使用区或县
      if (address.district) {
        locationCache.set(cacheKey, address.district)
        return address.district
      }
      if (address.county) {
        locationCache.set(cacheKey, address.county)
        return address.county
      }
      // 如果都没有，使用省/州名称
      if (address.state) {
        locationCache.set(cacheKey, address.state)
        return address.state
      }
    }
    
    // 如果无法获取具体地名，返回经纬度
    return `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`
  } catch (err) {
    console.error('反向地理编码错误:', err)
    // 发生错误时返回经纬度
    return `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`
  }
}

const fetchWeatherData = async () => {
  try {
    loading.value = true

    // 如果没有位置信息，先获取位置
    if (!currentLatitude.value || !currentLongitude.value) {
      const position = await getCurrentPosition()
      currentLatitude.value = position.coords.latitude
      currentLongitude.value = position.coords.longitude
      
      // 获取并更新位置名称
      location.value = await getLocationName(currentLatitude.value, currentLongitude.value)
    }

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${currentLatitude.value}&longitude=${currentLongitude.value}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,cloud_cover,pressure_msl,visibility,dew_point_2m,precipitation,uv_index&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`
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
      const now = new Date()
      const currentHour = now.getHours()
      
      // 找到当前小时在数组中的索引
      const currentIndex = data.hourly.time.findIndex((time: string) => {
        const timeDate = new Date(time)
        return timeDate.getHours() === currentHour &&
               timeDate.getDate() === now.getDate() &&
               timeDate.getMonth() === now.getMonth()
      })
      
      // 如果找到当前小时，从当前小时开始截取24小时的数据
      if (currentIndex !== -1) {
        hourlyForecast.value = Array.from({ length: 24 }, (_, index) => {
          const dataIndex = currentIndex + index
          // 确保不超出数据范围
          if (dataIndex < data.hourly.time.length) {
            return {
              time: data.hourly.time[dataIndex],
              temperature: Math.round(data.hourly.temperature_2m[dataIndex]),
              weatherCode: data.hourly.weather_code[dataIndex],
              precipProbability: data.hourly.precipitation_probability[dataIndex]
            }
          }
          return null
        }).filter(Boolean) as HourlyForecast[]
      }
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

// 修改格式化小时的显示方式，去掉重复的"时"字
const formatHour = (time: string) => {
  if (!time) return '--'
  
  const timeDate = new Date(time)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  
  const isToday = timeDate.getDate() === now.getDate()
  const isTomorrow = timeDate.getDate() === tomorrow.getDate()
  
  // 只获取小时数字
  const hour = timeDate.getHours()
  
  if (isToday) {
    // 今天只显示小时
    return `${hour}时`
  } else if (isTomorrow) {
    // 明天显示 "+1"
    return `+1 ${hour}时`
  } else {
    // 其他日期显示 "+n"
    const dayDiff = Math.floor((timeDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
    return `+${dayDiff} ${hour}时`
  }
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
.weather-popup {
  font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

/* 自定义纵向滚动条 */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(100, 116, 139, 0.3) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(100, 116, 139, 0.3);
  border-radius: 2px;
}

/* 自定义横向滚动条 */
.custom-scrollbar-x {
  scrollbar-width: thin;
  scrollbar-color: rgba(100, 116, 139, 0.3) transparent;
}

.custom-scrollbar-x::-webkit-scrollbar {
  height: 4px;
}

.custom-scrollbar-x::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar-x::-webkit-scrollbar-thumb {
  background-color: rgba(100, 116, 139, 0.3);
  border-radius: 2px;
}
</style> 