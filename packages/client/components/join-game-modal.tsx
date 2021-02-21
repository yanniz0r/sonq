import { FC } from "react";
import { Button } from "./button";
import Input, { InputErrorMessage } from "./input";
import Modal from "./modal";
import { useFormik } from 'formik';
import { SocketClient } from "@sonq/api";
import * as yup from 'yup';

interface JoinGameModalProps {
  open?: boolean;
  onJoin?(username: string);
}

const JoinGameModal: FC<JoinGameModalProps> = ({ open, onJoin }) => {
  const form = useFormik<SocketClient.JoinEvent>({
    initialValues: {
      username: ''
    },
    validationSchema: yup.object({
      username: yup.string().required().min(3, 'Bitte gib mindestens drei Zeichen ein')
    }),
    onSubmit(values) {
      onJoin?.(values.username);
    }
  })
  return <Modal open={open}>
    <h2 className="font-bold text-3xl">Hello there</h2>
    <p className="text-lg text-gray-400 my-2">Please enter your name</p>
    <form onSubmit={form.handleSubmit}>
      <Input value={form.values.username} onChange={form.handleChange} name="username" />
      <Button type="submit">Join</Button>
    </form>
    {form.errors.username && form.touched.username && <InputErrorMessage>{form.errors.username}</InputErrorMessage> }
  </Modal>
}

export default JoinGameModal
