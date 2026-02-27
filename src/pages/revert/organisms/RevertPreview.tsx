import { OperationPreview } from "../../../components/organisms/OperationPreview";
import type { CommitDetail } from "../../../services/history";

interface RevertPreviewProps {
  detail: CommitDetail | null;
}

export function RevertPreview({ detail }: RevertPreviewProps) {
  return <OperationPreview detail={detail} hashClassName="warning" />;
}
