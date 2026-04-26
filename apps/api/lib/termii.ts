const formatToInternational = (phoneNumber: string): string => {
  return phoneNumber.startsWith('228') ? phoneNumber : `228${phoneNumber}`
}

const sendOTP = async (otp: number, phoneNumber: string) => {
  const data = {
    api_key: process.env.TERMII_API_KEY,
    message_type: 'NUMERIC',
    to: formatToInternational(phoneNumber),
    from: 'Skillmap',
    channel: 'dnd',
    pin_attempts: 10,
    pin_time_to_live: 5,
    pin_length: 6,
    pin_placeholder: '< >',
    message_text: `Votre code OTP pour vérifier votre compte est ${otp}`,
    pin_type: 'NUMERIC',
  }

  try {
    const res = await fetch('https://v3.api.termii.com/api/sms/otp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const errorBody = await res.text()
      console.error('Termii error:', errorBody)
      return { status: 'error', message: "Erreur lors de l'envoi de l'OTP" }
    }

    const responseBody = await res.json()
    console.log('Termii response:', responseBody)

    return { status: 'success', message: 'OTP envoyé avec succès' }
  } catch (error) {
    console.error('Termii fetch error:', error)
    return { status: 'error', message: "Erreur réseau lors de l'envoi de l'OTP" }
  }
}

export { sendOTP }
