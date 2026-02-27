import type { FC } from "react";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonActionSheet,
  IonFab,
  IonFabButton,
  IonIcon,
} from "@ionic/react";
import { ellipsisVertical, add, pencil, trash } from "ionicons/icons";
import { useSplits } from "../hooks/useSplits";

const SplitDetail: FC = () => {
  const { splitId } = useParams<{ splitId: string }>();
  const navigate = useNavigate();
  const { data: splits } = useSplits();
  const [showActionSheet, setShowActionSheet] = useState(false);

  const split = splits?.find((s) => s.id === splitId);

  const handleAddExpense = () => {
    console.log("Add expense to split:", splitId);
  };

  if (!splits) return null;

  if (!split) {
    void navigate("/", { replace: true });
    return null;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            {
              //TODO IonBackButton will cause the entire app to reload, need to find a way to prevent that --- IGNORE ---
            }
            <IonBackButton defaultHref="/" text="" />
          </IonButtons>
          <IonTitle>
            {split.emoji} {split.name}
          </IonTitle>
          <IonButtons slot="end">
            <IonButton
              onClick={() => {
                setShowActionSheet(true);
              }}
            >
              <IonIcon slot="icon-only" icon={ellipsisVertical} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => {
          setShowActionSheet(false);
        }}
        buttons={[
          {
            text: "Edit",
            icon: pencil,
            handler: () => {
              console.log("Edit split:", splitId);
            },
          },
          {
            text: "Delete",
            role: "destructive",
            icon: trash,
            handler: () => {
              console.log("Delete split:", splitId);
            },
          },
        ]}
      />

      <IonContent className="ion-padding">
        <IonFab vertical="bottom" horizontal="center" slot="fixed">
          <IonFabButton onClick={handleAddExpense}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default SplitDetail;
