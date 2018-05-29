import {
  ControlLabel,
  FormControl,
  FormGroup,
  HelpBlock,
} from 'react-bootstrap';
import { Formik } from 'formik';
import { NotificationManager } from 'react-notifications';
import React from 'react';
import mapValues from 'lodash/mapValues';
import pick from 'lodash/pick';
import Yup from 'yup';

// https://stackoverflow.com/a/20971688/2750114
/* eslint-disable no-useless-escape */
const PHONE_REGEX = /^(?:(?:\(?(?:00|\+)([1-4]\d\d|[1-9]\d?)\)?)?[\-\.\ \\\/]?)?((?:\(?\d{1,}\)?[\-\.\ \\\/]?){0,})(?:[\-\.\ \\\/]?(?:#|ext\.?|extension|x)[\-\.\ \\\/]?(\d+))?$/i;
/* eslint-enable no-useless-escape */

const emailValidator = () => Yup.string().email('Invalid email address');
const phoneValidator = () =>
  Yup.string()
    // https://stackoverflow.com/questions/14894899/what-is-the-minimum-length-of-a-valid-international-phone-number
    .min(4, 'Phone number should be at least 4 characters logs')
    .max(24, 'Phone number should be at most 24 characters logs')
    .matches(PHONE_REGEX, 'Invalid phone number');

@Formik({
  validationSchema: Yup.object().shape({
    display_name: Yup.string().required('Company name is required'),
    admin_phone: phoneValidator(),
    admin_email: emailValidator(),
    billing_phone: phoneValidator(),
    billing_email: emailValidator(),
  }),

  mapPropsToValues: ({ organization }) =>
    mapValues(
      pick(organization, [
        'display_name',
        'admin_email',
        'admin_phone',
        'billing_email',
        'billing_phone',
      ]),
      value => value || ''
    ),

  handleSubmit: async (
    data,
    { isSubmitting, props, setErrors, setSubmitting }
  ) => {
    if (isSubmitting) {
      return;
    }
    props
      .updateOrganizationContactData(data)
      .then(() => {
        NotificationManager.success('Contact data has been updated');
        setSubmitting(false);
      })
      .catch(error => {
        if (
          error &&
          error.graphQLErrors &&
          error.graphQLErrors[0].path &&
          error.graphQLErrors[0].errors &&
          error.graphQLErrors[0].errors[0]
        ) {
          setErrors({
            [error.graphQLErrors[0].path]: error.graphQLErrors[0].errors[0],
          });
        }
        NotificationManager.error('Cannot update contact data');
        setSubmitting(false);
      });
  },
})
export default class ContactInfoForm extends React.Component {
  handleChange = event => {
    this.props.handleChange(event);
    this.props.setTouched({
      ...this.props.touched,
      [event.target.name]: true,
    });
  };

  renderField({ name, label, type }) {
    const { errors, touched, values } = this.props;
    const error = errors[name];
    const value = values[name];

    let validationState;
    if (touched[name]) {
      if (error) {
        validationState = 'error';
      } else {
        validationState = 'success';
      }
    }

    return (
      <FormGroup validationState={validationState}>
        <ControlLabel>
          {label}
        </ControlLabel>
        <FormControl
          type={type || 'text'}
          name={name}
          value={value || ''}
          onChange={this.handleChange}
        />
        <FormControl.Feedback />
        {error &&
          <HelpBlock>
            {error}
          </HelpBlock>}
      </FormGroup>
    );
  }

  render() {
    const { handleSubmit, isSubmitting } = this.props;

    const submitButtonText = isSubmitting ? 'Saving' : 'Save';

    return (
      <form onSubmit={handleSubmit}>
        {this.renderField({
          name: 'display_name',
          label: 'Company name',
        })}
        {this.renderField({
          name: 'admin_phone',
          label: 'Administrator contact phone',
        })}
        {this.renderField({
          name: 'admin_email',
          label: 'Administrator contact email',
        })}
        {this.renderField({
          name: 'billing_phone',
          label: 'Billing phone',
        })}
        {this.renderField({
          name: 'billing_email',
          label: 'Billing email',
        })}
        <button className="btn btn-primary pull-right" disabled={isSubmitting}>
          {submitButtonText}
        </button>
      </form>
    );
  }
}
