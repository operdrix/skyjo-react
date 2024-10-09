import { useEffect, useState } from "react"

interface ModalProps {
  id: string
  title: string
  message: string
  type?: "error" | "success" | "info" | "warning" | null
  open?: boolean
}

const SvgAlert = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    className="stroke-info h-6 w-6 shrink-0">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
)

const SvgSuccess = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 shrink-0 stroke-current"
    fill="none"
    viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M5 13l4 4L19 7" />
  </svg>
)

const SvgError = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 shrink-0 stroke-current"
    fill="none"
    viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const SvgInfo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    className="h-6 w-6 shrink-0 stroke-current">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
)

const SvgWarning = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 shrink-0 stroke-current"
    fill="none"
    viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

export default function Modal({ id, title, message, type = null, open = false }: ModalProps) {
  const [isOpen, setIsOpen] = useState(open)

  const openModal = () => {
    const modal = document.getElementById(id)
    if (modal) {
      (modal as HTMLDialogElement).showModal()
      setIsOpen(true)
    }
  }

  const closeModal = () => {
    const modal = document.getElementById(id)
    if (modal) {
      (modal as HTMLDialogElement).close()
      setIsOpen(false)
    }
  }

  useEffect(() => {
    const modal = document.getElementById(id)
    if (modal) {
      modal.addEventListener('close', () => {
        setIsOpen(false)
      })
    }
  }, [id])

  useEffect(() => {
    if (isOpen) {
      openModal()
    } else {
      closeModal()
    }
  }, [isOpen])

  return (
    <dialog id={id} className="modal modal-bottom sm:modal-middle" open={isOpen}>
      <div className="modal-box">
        <div role="alert" className={`alert ${type && 'alert-' + type}`}>
          {type === 'success' && <SvgSuccess />}
          {type === 'error' && <SvgError />}
          {type === 'info' && <SvgInfo />}
          {type === 'warning' && <SvgWarning />}
          {type === null && <SvgAlert />}
          <span>{title}</span>
        </div>
        <p className='mt-5' dangerouslySetInnerHTML={{ __html: message || '' }}></p>
        <div className="modal-action">
          <form method="dialog">
            <button className="btn">Fermer</button>
          </form>
        </div>
      </div>
    </dialog>
  )
}
