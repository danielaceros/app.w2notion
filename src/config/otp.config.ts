import { NgOtpInputConfig } from "ng-otp-input";

export const otpConfig:NgOtpInputConfig = {
    allowNumbersOnly: true,
    length: 6,
    isPasswordInput: false,
    disableAutoFocus: false,
    placeholder: '',
    inputStyles: {
        'display': 'flex',
        'border': '5px solid #2bce6c',  // Agregué un borde azul para resaltar cada input
        'border-radius': '10px',
        'background-color': '#27272727',
        'color': '#2bce6c',
        'box-shadow': '0 0 10px rgba(0, 0, 0, 0.1)',
        'transition': 'border-color 0.3s, box-shadow 0.3s',
      },
      containerStyles: {
        'display': 'flex',
        'flex-direction': 'row',
        'align-items': 'center',
        'justify-content': 'center',
        'margin': '5%',
        'height': '50vh',
      },
    inputClass:'each_input',
    containerClass:'all_inputs'
  };