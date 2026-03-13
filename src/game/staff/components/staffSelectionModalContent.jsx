import PropTypes from "prop-types";
import Button, { BUTTON_VARIANT } from "../../../engine/ui/button/button";
import "./staffSelectionModalContent.scss";

const formatStaffMetaLine = (staffMember) => {
  const overall = Number(staffMember?.payload?.overallRating) || 0;
  const scouting = Number(staffMember?.payload?.scouting) || 0;
  const judgement = Number(staffMember?.payload?.judgement) || 0;
  const gkTraining = Number(staffMember?.payload?.gkTraining) || 0;
  const dfTraining = Number(staffMember?.payload?.dfTraining) || 0;
  const mdTraining = Number(staffMember?.payload?.mdTraining) || 0;
  const atTraining = Number(staffMember?.payload?.atTraining) || 0;

  return `OVR ${overall} | Sco ${scouting} | Jud ${judgement} | GK ${gkTraining} | DF ${dfTraining} | MD ${mdTraining} | AT ${atTraining}`;
};

const StaffSelectionModalContent = ({
  title,
  description,
  staffMembers,
  onSelectStaff,
  onCancel,
  actionLabel,
}) => {
  const safeStaffMembers = Array.isArray(staffMembers) ? staffMembers : [];

  return (
    <section className="staffSelectionModal">
      <header className="staffSelectionModal__head">
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </header>

      {safeStaffMembers.length === 0 ? (
        <p className="staffSelectionModal__empty">No active staff available.</p>
      ) : (
        <div className="staffSelectionModal__list">
          {safeStaffMembers.map((staffMember, index) => (
            <article
              key={staffMember?.id ?? `staff-member-${index + 1}`}
              className="staffSelectionModal__item"
            >
              <div className="staffSelectionModal__itemMeta">
                <h4>{staffMember?.name ?? `Staff ${index + 1}`}</h4>
                <p>{formatStaffMetaLine(staffMember)}</p>
              </div>
              <Button
                variant={BUTTON_VARIANT.PRIMARY}
                onClick={() => onSelectStaff(staffMember?.id)}
              >
                {actionLabel}
              </Button>
            </article>
          ))}
        </div>
      )}

      <div className="staffSelectionModal__actions">
        <Button variant={BUTTON_VARIANT.SECONDARY} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </section>
  );
};

StaffSelectionModalContent.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  staffMembers: PropTypes.arrayOf(PropTypes.object),
  onSelectStaff: PropTypes.func,
  onCancel: PropTypes.func,
  actionLabel: PropTypes.string,
};

StaffSelectionModalContent.defaultProps = {
  title: "Select Staff Member",
  description: "",
  staffMembers: [],
  onSelectStaff: () => {},
  onCancel: () => {},
  actionLabel: "Select",
};

export default StaffSelectionModalContent;
