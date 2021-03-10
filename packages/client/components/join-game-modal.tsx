import { FC } from "react";
import { Button } from "./button";
import Input, { InputErrorMessage } from "./input";
import Modal from "./modal";
import { useFormik } from "formik";
import { SocketClient } from "@sonq/api";
import * as yup from "yup";
import { useTranslation } from "react-i18next";

interface JoinGameModalProps {
  open?: boolean;
  onJoin?(username: string);
}

const JoinGameModal: FC<JoinGameModalProps> = ({ open, onJoin }) => {
  const { t } = useTranslation("game");
  const form = useFormik<SocketClient.JoinEvent>({
    initialValues: {
      username: "",
    },
    validationSchema: yup.object({
      username: yup
        .string()
        .required()
        .min(3, t("common:validation.minLength", { count: 3 })),
    }),
    onSubmit(values) {
      onJoin?.(values.username);
    },
  });
  return (
    <Modal open={open}>
      <h2 className="font-bold text-3xl">{t("joinGameModalHeadline")}</h2>
      <p className="text-lg text-gray-400 my-2">
        {t("joinGameModalDescription")}
      </p>
      <form onSubmit={form.handleSubmit} className="flex">
        <Input
          value={form.values.username}
          onChange={form.handleChange}
          name="username"
          className="flex-grow mr-2"
        />
        <Button type="submit">{t("joinGameModalJoinButton")}</Button>
      </form>
      {form.errors.username && form.touched.username && (
        <InputErrorMessage>{form.errors.username}</InputErrorMessage>
      )}
    </Modal>
  );
};

export default JoinGameModal;
