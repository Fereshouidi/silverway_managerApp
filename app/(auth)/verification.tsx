import LoadingScreen from '@/components/sub/loading/loadingScreen'
import { useAdmin } from '@/contexts/admin'
import { useRouter } from 'expo-router'
import React from 'react'
import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const Verification = () => {

    const { admin } = useAdmin();
    const router = useRouter()

    if (!admin) return <LoadingScreen/>

    if (admin?.isVerified) {
        router.replace('/(auth)/welcome')
    }


  return (
    <SafeAreaView>
        <Text>
            Verification
        </Text>
    </SafeAreaView>
  )
}

export default Verification
