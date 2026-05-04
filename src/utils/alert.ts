import Swal from 'sweetalert2'

export const showError = (title: string, message?: string) =>
  Swal.fire({
    icon: 'error',
    title,
    text: message,
    confirmButtonColor: '#2563eb',
    confirmButtonText: 'OK',
  })

export const showSuccess = (title: string, message?: string) =>
  Swal.fire({
    icon: 'success',
    title,
    text: message,
    confirmButtonColor: '#2563eb',
    timer: 2500,
    timerProgressBar: true,
    showConfirmButton: false,
  })

export const showWarning = (title: string, message?: string) =>
  Swal.fire({
    icon: 'warning',
    title,
    text: message,
    confirmButtonColor: '#2563eb',
  })

export const showConfirm = (title: string, message?: string) =>
  Swal.fire({
    icon: 'question',
    title,
    text: message,
    showCancelButton: true,
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Yes',
    cancelButtonText: 'No',
  })
