import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { AcceptInvitationResponseDto, CreateInvitationDto, InvitationResponseDto } from "../generated/api.schemas";
import { getInvitations } from "../generated/invitations/invitations";

const { invitationsControllerCreate, invitationsControllerAccept } = getInvitations();

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

export const useAcceptInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    AcceptInvitationResponseDto,
    AxiosError<ErrorResponse>,
    string
  >({
    mutationFn: invitationsControllerAccept,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["splits"] }).catch(() => {});
    },
  });
};
