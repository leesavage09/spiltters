import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { CreateInvitationDto, InvitationResponseDto } from "../generated/api.schemas";
import { getInvitations } from "../generated/invitations/invitations";

const { invitationsControllerCreate } = getInvitations();

interface ErrorResponse {
  message: string;
  statusCode: number;
}

export const useCreateInvitation = () => {
  return useMutation<
    InvitationResponseDto,
    AxiosError<ErrorResponse>,
    CreateInvitationDto
  >({
    mutationFn: invitationsControllerCreate,
  });
};
